-- Alter weight_tons column to accept decimal values
ALTER TABLE public.collection_orders ALTER COLUMN weight_tons TYPE numeric USING weight_tons::numeric;

-- Add doc_number column to boletos if not exists (for the Doc field in Cobrancas form)
-- Already added in previous migration, so skip if exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'boletos' AND column_name = 'doc_number') THEN
    ALTER TABLE public.boletos ADD COLUMN doc_number TEXT;
  END IF;
END $$;