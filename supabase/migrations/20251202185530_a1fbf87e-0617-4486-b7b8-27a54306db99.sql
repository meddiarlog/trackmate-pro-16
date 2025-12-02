-- Add new columns to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS responsavel text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS prazo_dias integer DEFAULT 30;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS observacoes text;

-- Create customer_contacts table for multiple contacts
CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'comercial',
  telefone text,
  email text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for customer_contacts
CREATE POLICY "Anyone can view customer_contacts" ON public.customer_contacts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert customer_contacts" ON public.customer_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update customer_contacts" ON public.customer_contacts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete customer_contacts" ON public.customer_contacts FOR DELETE USING (true);