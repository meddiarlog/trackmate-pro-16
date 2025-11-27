-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  neighborhood TEXT,
  loading_location TEXT,
  unloading_location TEXT,
  type TEXT,
  cpf_cnpj TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Anyone can view customers"
  ON public.customers
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert customers"
  ON public.customers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update customers"
  ON public.customers
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete customers"
  ON public.customers
  FOR DELETE
  USING (true);

-- Create trigger for automatic timestamp updates on customers
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better query performance
CREATE INDEX idx_customers_name ON public.customers(name);
CREATE INDEX idx_customers_cpf_cnpj ON public.customers(cpf_cnpj);