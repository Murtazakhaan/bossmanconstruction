ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS donor_type TEXT,
  ADD COLUMN IF NOT EXISTS donor_type_other TEXT,
  ADD COLUMN IF NOT EXISTS recipient_type TEXT,
  ADD COLUMN IF NOT EXISTS recipient_type_other TEXT;