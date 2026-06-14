
-- 1) PROFILES: restrict broad SELECT; expose only safe columns via a public view
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Safe, public-facing subset (name + org only) for browsing materials/transactions
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, org_name, bio FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;

-- Allow counterparties of a transaction to see each other's safe profile fields
CREATE POLICY "Transaction counterparties can view profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE (t.contractor_id = auth.uid() AND t.recipient_id = public.profiles.id)
       OR (t.recipient_id = auth.uid() AND t.contractor_id = public.profiles.id)
  )
);

-- 2) STORAGE: explicit UPDATE policy mirroring INSERT for material-photos
CREATE POLICY "Contractors update their own material photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'material-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'material-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3) USER_ROLES: explicit restrictive deny so non-admins can never insert/update/delete
CREATE POLICY "Only admins may write roles"
ON public.user_roles AS RESTRICTIVE FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) REALTIME: scope channel subscriptions to authorized users only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow subscribing to a transaction channel only if the user is a party to it
CREATE POLICY "Parties can subscribe to their transaction channel"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE 'tx:%'
  AND EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id::text = split_part(realtime.topic(), ':', 2)
      AND (t.contractor_id = auth.uid() OR t.recipient_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Allow subscribing to a user-scoped notification channel only for the owner
CREATE POLICY "Users can subscribe to their own notification channel"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE 'user:%'
  AND split_part(realtime.topic(), ':', 2) = auth.uid()::text
);
