
-- =========================================================
-- ROLES
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('contractor', 'recipient', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can see their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can see all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  org_name TEXT,
  phone TEXT,
  address_line TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- update_updated_at trigger func
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile + default recipient role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF _role_text NOT IN ('contractor','recipient') THEN
    _role_text := 'recipient';
  END IF;
  _role := _role_text::public.app_role;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- MATERIAL CATEGORIES
-- =========================================================
CREATE TABLE public.material_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0
);

GRANT SELECT ON public.material_categories TO authenticated, anon;
GRANT ALL ON public.material_categories TO service_role;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.material_categories
  FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.material_categories (name, sort_order) VALUES
  ('Lumber', 10),
  ('Drywall', 20),
  ('Insulation', 30),
  ('Roofing', 40),
  ('Flooring', 50),
  ('Electrical', 60),
  ('Plumbing', 70),
  ('Doors & Windows', 80),
  ('Hardware', 90),
  ('Paint & Finishes', 100),
  ('Other', 999);

-- =========================================================
-- MATERIALS
-- =========================================================
CREATE TYPE public.material_status AS ENUM ('available', 'reserved', 'claimed', 'removed');

CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.material_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'units',
  unit_value_usd NUMERIC NOT NULL DEFAULT 0 CHECK (unit_value_usd >= 0),
  total_value_usd NUMERIC GENERATED ALWAYS AS (quantity * unit_value_usd) STORED,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  pickup_address TEXT,
  pickup_city TEXT,
  pickup_state TEXT,
  pickup_zip TEXT,
  available_from DATE,
  available_until DATE,
  status public.material_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX materials_status_idx ON public.materials (status);
CREATE INDEX materials_contractor_idx ON public.materials (contractor_id);
CREATE INDEX materials_category_idx ON public.materials (category_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view materials"
  ON public.materials FOR SELECT TO authenticated USING (true);

CREATE POLICY "Contractors can create their own materials"
  ON public.materials FOR INSERT TO authenticated
  WITH CHECK (contractor_id = auth.uid() AND public.has_role(auth.uid(), 'contractor'));

CREATE POLICY "Contractors can update their own materials"
  ON public.materials FOR UPDATE TO authenticated
  USING (contractor_id = auth.uid());

CREATE POLICY "Contractors can delete their own materials"
  ON public.materials FOR DELETE TO authenticated
  USING (contractor_id = auth.uid());

CREATE POLICY "Admins manage all materials"
  ON public.materials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER materials_set_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- TRANSACTIONS
-- =========================================================
CREATE TYPE public.transaction_status AS ENUM
  ('requested','scheduled','in_progress','completed','canceled');

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_quantity NUMERIC NOT NULL CHECK (requested_quantity > 0),
  status public.transaction_status NOT NULL DEFAULT 'requested',
  pickup_scheduled_at TIMESTAMPTZ,
  pickup_address TEXT,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  value_at_completion_usd NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX transactions_status_idx ON public.transactions (status);
CREATE INDEX transactions_contractor_idx ON public.transactions (contractor_id);
CREATE INDEX transactions_recipient_idx ON public.transactions (recipient_id);
CREATE INDEX transactions_material_idx ON public.transactions (material_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view their own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (contractor_id = auth.uid() OR recipient_id = auth.uid()
         OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Recipients can create requests"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (recipient_id = auth.uid() AND public.has_role(auth.uid(), 'recipient'));

CREATE POLICY "Parties can update their own transactions"
  ON public.transactions FOR UPDATE TO authenticated
  USING (contractor_id = auth.uid() OR recipient_id = auth.uid()
         OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER transactions_set_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================
-- TRANSACTION EVENTS (audit trail)
-- =========================================================
CREATE TABLE public.transaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX transaction_events_tx_idx ON public.transaction_events (transaction_id);

GRANT SELECT, INSERT ON public.transaction_events TO authenticated;
GRANT ALL ON public.transaction_events TO service_role;
ALTER TABLE public.transaction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view tx events"
  ON public.transaction_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_id
      AND (t.contractor_id = auth.uid() OR t.recipient_id = auth.uid()
           OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Parties can insert tx events"
  ON public.transaction_events FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id
        AND (t.contractor_id = auth.uid() OR t.recipient_id = auth.uid()
             OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- =========================================================
-- MESSAGES (per transaction chat)
-- =========================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 4000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_tx_idx ON public.messages (transaction_id, created_at);

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.id = transaction_id
      AND (t.contractor_id = auth.uid() OR t.recipient_id = auth.uid()
           OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Parties can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transaction_id
        AND (t.contractor_id = auth.uid() OR t.recipient_id = auth.uid())
    )
  );

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- =========================================================
-- REALTIME
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
