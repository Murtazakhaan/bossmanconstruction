
-- 1) New table for sensitive contact details
CREATE TABLE IF NOT EXISTS public.profile_contacts (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone text,
  address_line text,
  city text,
  state text,
  zip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_contacts TO authenticated;
GRANT ALL ON public.profile_contacts TO service_role;

ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contact details"
ON public.profile_contacts FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all contact details"
ON public.profile_contacts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own contact details"
ON public.profile_contacts FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own contact details"
ON public.profile_contacts FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any contact details"
ON public.profile_contacts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete any contact details"
ON public.profile_contacts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Migrate existing data
INSERT INTO public.profile_contacts (id, phone, address_line, city, state, zip)
SELECT id, phone, address_line, city, state, zip
FROM public.profiles
WHERE phone IS NOT NULL
   OR address_line IS NOT NULL
   OR city IS NOT NULL
   OR state IS NOT NULL
   OR zip IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- 3) Drop sensitive columns from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS address_line,
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS zip;

-- 4) Recreate public_profiles view as SECURITY INVOKER (safe — no sensitive cols)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, org_name, bio
FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM PUBLIC;
REVOKE ALL ON public.public_profiles FROM anon;
GRANT SELECT ON public.public_profiles TO authenticated;

-- 5) Re-add counterparty SELECT policy on profiles (now safe — only display fields remain)
CREATE POLICY "Transaction counterparties can view profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE (t.contractor_id = auth.uid() AND t.recipient_id = public.profiles.id)
       OR (t.recipient_id = auth.uid() AND t.contractor_id = public.profiles.id)
  )
);

-- 6) Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.tg_profile_contacts_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_contacts_touch ON public.profile_contacts;
CREATE TRIGGER trg_profile_contacts_touch
BEFORE UPDATE ON public.profile_contacts
FOR EACH ROW EXECUTE FUNCTION public.tg_profile_contacts_touch();

REVOKE EXECUTE ON FUNCTION public.tg_profile_contacts_touch() FROM PUBLIC, anon, authenticated;
