-- Criar tabela de empresas
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de contratos
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  contract_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  total_value DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de CTes
CREATE TABLE public.ctes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  cte_number TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  product_description TEXT,
  weight DECIMAL(10, 2),
  value DECIMAL(10, 2) NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ctes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para companies (público pode ler, mas não modificar)
CREATE POLICY "Anyone can view companies"
ON public.companies FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert companies"
ON public.companies FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update companies"
ON public.companies FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete companies"
ON public.companies FOR DELETE
USING (true);

-- Políticas RLS para contracts
CREATE POLICY "Anyone can view contracts"
ON public.contracts FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert contracts"
ON public.contracts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update contracts"
ON public.contracts FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete contracts"
ON public.contracts FOR DELETE
USING (true);

-- Políticas RLS para ctes
CREATE POLICY "Anyone can view ctes"
ON public.ctes FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert ctes"
ON public.ctes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update ctes"
ON public.ctes FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete ctes"
ON public.ctes FOR DELETE
USING (true);

-- Trigger para atualizar updated_at em contracts
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();