-- Add unique constraints for anti-duplicity

-- 1. Unique constraint on customers cpf_cnpj (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_cpf_cnpj_unique 
ON public.customers (cpf_cnpj) 
WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != '';

-- 2. Unique constraint on drivers cpf (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_cpf_unique 
ON public.drivers (cpf) 
WHERE cpf IS NOT NULL AND cpf != '';

-- 3. Unique constraint on vehicle_owners cpf (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_owners_cpf_unique 
ON public.vehicle_owners (cpf) 
WHERE cpf IS NOT NULL AND cpf != '';

-- 4. Unique constraint on vehicle_owners cnpj (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_owners_cnpj_unique 
ON public.vehicle_owners (cnpj) 
WHERE cnpj IS NOT NULL AND cnpj != '';

-- 5. Unique constraint on suppliers cnpj (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_cnpj_unique 
ON public.suppliers (cnpj) 
WHERE cnpj IS NOT NULL AND cnpj != '';

-- 6. Unique constraint on credit_control chave_acesso
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_control_chave_acesso_unique 
ON public.credit_control (chave_acesso);

-- 7. Create vehicles table with unique plate constraint
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_plate TEXT NOT NULL UNIQUE,
  year INTEGER,
  model TEXT,
  renavam TEXT,
  vehicle_type TEXT,
  body_type TEXT,
  capacity TEXT,
  status TEXT DEFAULT 'Disponível',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vehicles
CREATE POLICY "Anyone can view vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update vehicles" ON public.vehicles FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete vehicles" ON public.vehicles FOR DELETE USING (true);

-- Create trigger for vehicles updated_at
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create company_settings table for company data
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj TEXT UNIQUE,
  inscricao_estadual TEXT,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  cep TEXT,
  neighborhood TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on company_settings
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_settings
CREATE POLICY "Anyone can view company_settings" ON public.company_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert company_settings" ON public.company_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update company_settings" ON public.company_settings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete company_settings" ON public.company_settings FOR DELETE USING (true);

-- Create trigger for company_settings updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();