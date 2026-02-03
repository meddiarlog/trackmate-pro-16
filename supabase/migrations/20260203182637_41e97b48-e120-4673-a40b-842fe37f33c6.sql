-- Create customer_groups table
CREATE TABLE public.customer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;

-- Create policy for full access
CREATE POLICY "Allow all access to customer_groups" 
  ON public.customer_groups FOR ALL USING (true) WITH CHECK (true);

-- Add group_id column to customers table
ALTER TABLE public.customers 
ADD COLUMN group_id UUID REFERENCES public.customer_groups(id);

-- Add group_id and observacoes columns to boletos table
ALTER TABLE public.boletos 
ADD COLUMN group_id UUID REFERENCES public.customer_groups(id),
ADD COLUMN observacoes TEXT;