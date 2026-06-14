-- Fix: the previous RESTRICTIVE "FOR ALL" admin-only policy on user_roles
-- prevented regular users from SELECTing their own role, which broke
-- role-based UI everywhere (contractors saw the recipient view).
-- Keep the admin-only restriction for writes (INSERT/UPDATE/DELETE) but
-- allow reads to flow through the existing permissive SELECT policies.

DROP POLICY IF EXISTS "Only admins can manage user_roles" ON public.user_roles;

CREATE POLICY "Only admins can insert user_roles"
ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update user_roles"
ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete user_roles"
ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));