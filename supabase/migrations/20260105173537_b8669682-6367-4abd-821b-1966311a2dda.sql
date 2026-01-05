-- Add payment proof columns to boletos table
ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS comprovante_url TEXT;
ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS comprovante_name TEXT;