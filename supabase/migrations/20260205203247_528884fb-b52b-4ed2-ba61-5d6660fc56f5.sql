-- Add commercial information columns to company_settings
ALTER TABLE public.company_settings
ADD COLUMN IF NOT EXISTS vendedor TEXT,
ADD COLUMN IF NOT EXISTS contato TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;