-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies for suppliers
CREATE POLICY "Anyone can view suppliers" 
ON public.suppliers 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert suppliers" 
ON public.suppliers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update suppliers" 
ON public.suppliers 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete suppliers" 
ON public.suppliers 
FOR DELETE 
USING (true);

-- Create vehicle_owners table
CREATE TABLE public.vehicle_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  cpf TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  type TEXT DEFAULT 'pessoa_fisica',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vehicle_owners ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicle_owners
CREATE POLICY "Anyone can view vehicle_owners" 
ON public.vehicle_owners 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert vehicle_owners" 
ON public.vehicle_owners 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update vehicle_owners" 
ON public.vehicle_owners 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete vehicle_owners" 
ON public.vehicle_owners 
FOR DELETE 
USING (true);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_owners_updated_at
BEFORE UPDATE ON public.vehicle_owners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();