
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS service_transporte BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS service_munck BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS service_carregamento BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS service_descarga BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS carregamento_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS descarga_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS carga_responsavel TEXT,
ADD COLUMN IF NOT EXISTS descarga_responsavel TEXT;

-- Migrar dados existentes baseado no service_type atual
UPDATE public.quotes SET service_transporte = true WHERE service_type = 'transporte';
UPDATE public.quotes SET service_munck = true WHERE service_type = 'munck';
