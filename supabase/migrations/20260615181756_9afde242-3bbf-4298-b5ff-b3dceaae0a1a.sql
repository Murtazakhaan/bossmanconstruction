
DROP POLICY IF EXISTS "Transaction counterparties can view profile" ON public.profiles;

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT id, full_name, org_name, bio
FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM PUBLIC;
REVOKE ALL ON public.public_profiles FROM anon;
GRANT SELECT ON public.public_profiles TO authenticated;
