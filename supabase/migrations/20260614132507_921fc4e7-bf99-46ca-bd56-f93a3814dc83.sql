
-- 1) Deduplicate: keep highest-priority role per user (admin > contractor > recipient)
DELETE FROM public.user_roles ur
USING public.user_roles keep
WHERE ur.user_id = keep.user_id
  AND ur.ctid <> keep.ctid
  AND (
    CASE keep.role WHEN 'admin' THEN 3 WHEN 'contractor' THEN 2 ELSE 1 END
    >
    CASE ur.role   WHEN 'admin' THEN 3 WHEN 'contractor' THEN 2 ELSE 1 END
  );

-- 2) Replace composite unique with single unique on user_id
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- 3) Update new-user trigger to respect uniqueness
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _role_text TEXT;
BEGIN
  INSERT INTO public.profiles (id, full_name, org_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'org_name',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  _role_text := COALESCE(NEW.raw_user_meta_data ->> 'role', 'recipient');
  IF _role_text NOT IN ('contractor','recipient','admin') THEN
    _role_text := 'recipient';
  END IF;
  _role := _role_text::public.app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 4) Admin full-CRUD policies

-- user_roles: admins manage all
DROP POLICY IF EXISTS "Admins manage all roles" ON public.user_roles;
CREATE POLICY "Admins manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- profiles: admins can delete
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- transactions: admins can delete
DROP POLICY IF EXISTS "Admins can delete any transaction" ON public.transactions;
CREATE POLICY "Admins can delete any transaction" ON public.transactions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- material_categories: admins manage
DROP POLICY IF EXISTS "Admins manage categories" ON public.material_categories;
CREATE POLICY "Admins manage categories" ON public.material_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT INSERT, UPDATE, DELETE ON public.material_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
