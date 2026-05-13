ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS freight_mode text,
  ADD COLUMN IF NOT EXISTS weight_kg numeric;