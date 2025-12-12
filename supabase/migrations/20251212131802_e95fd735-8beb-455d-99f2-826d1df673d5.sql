-- Create quotes table for commercial proposals
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number BIGINT NOT NULL DEFAULT nextval('quotes_quote_number_seq'),
  customer_id UUID REFERENCES public.customers(id),
  responsavel TEXT,
  contato TEXT,
  service_type TEXT NOT NULL DEFAULT 'transporte',
  origin_city TEXT,
  origin_state TEXT,
  destination_city TEXT,
  destination_state TEXT,
  product_id UUID REFERENCES public.products(id),
  freight_value NUMERIC DEFAULT 0,
  munck_value NUMERIC DEFAULT 0,
  vehicle_type_id UUID REFERENCES public.vehicle_types(id),
  delivery_days INTEGER DEFAULT 0,
  observations TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view quotes" ON public.quotes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quotes" ON public.quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quotes" ON public.quotes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete quotes" ON public.quotes FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add doc_number field to boletos table
ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS doc_number TEXT;

-- Add UPDATE and DELETE policies for products table
CREATE POLICY "Anyone can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete products" ON public.products FOR DELETE USING (true);