-- Create enum for fuel type
CREATE TYPE public.fuel_type AS ENUM ('DIESEL', 'DIESEL+ARLA');

-- Create credit_control table
CREATE TABLE public.credit_control (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_nfe TEXT NOT NULL,
  cnpj_emitente TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  valor_nfe NUMERIC NOT NULL,
  tipo_combustivel fuel_type NOT NULL,
  quantidade NUMERIC NOT NULL,
  credito NUMERIC NOT NULL,
  chave_acesso TEXT NOT NULL,
  uf TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.credit_control ENABLE ROW LEVEL SECURITY;

-- Create policies for credit_control
CREATE POLICY "Anyone can view credit control records"
ON public.credit_control
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert credit control records"
ON public.credit_control
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update credit control records"
ON public.credit_control
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete credit control records"
ON public.credit_control
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_credit_control_updated_at
BEFORE UPDATE ON public.credit_control
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();