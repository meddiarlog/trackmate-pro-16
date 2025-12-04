
-- Create products table (reusable)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products" ON public.products FOR INSERT WITH CHECK (true);

-- Create vehicle_types table (reusable)
CREATE TABLE public.vehicle_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view vehicle_types" ON public.vehicle_types FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vehicle_types" ON public.vehicle_types FOR INSERT WITH CHECK (true);

-- Create body_types table (carroceria - reusable)
CREATE TABLE public.body_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.body_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view body_types" ON public.body_types FOR SELECT USING (true);
CREATE POLICY "Anyone can insert body_types" ON public.body_types FOR INSERT WITH CHECK (true);

-- Create freight_types table with pre-populated data
CREATE TABLE public.freight_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.freight_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view freight_types" ON public.freight_types FOR SELECT USING (true);
CREATE POLICY "Anyone can insert freight_types" ON public.freight_types FOR INSERT WITH CHECK (true);

-- Insert default freight types
INSERT INTO public.freight_types (name) VALUES 
  ('Paletizados'),
  ('Animais'),
  ('Granel'),
  ('Enfardados'),
  ('Containerizado'),
  ('Carga Geral'),
  ('Frigorificada'),
  ('Perigosa'),
  ('Líquidos'),
  ('Siderúrgica');

-- Create collection_orders table
CREATE TABLE public.collection_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Left side fields
  weight_tons INTEGER NOT NULL,
  code TEXT,
  recipient_name TEXT NOT NULL,
  unloading_city TEXT NOT NULL,
  unloading_state TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id),
  freight_type_id UUID REFERENCES public.freight_types(id),
  order_request_number TEXT,
  observations TEXT,
  employee_name TEXT,
  payment_method TEXT NOT NULL,
  
  -- Right side - Driver data (from drivers table)
  driver_id UUID REFERENCES public.drivers(id),
  driver_name TEXT,
  driver_cpf TEXT,
  driver_phone TEXT,
  driver_cnh TEXT,
  driver_cnh_expiry DATE,
  
  -- Right side - Owner/Patrão data
  owner_name TEXT,
  owner_phone TEXT,
  
  -- Right side - Vehicle data
  vehicle_plate TEXT,
  trailer_plates TEXT[], -- Array for multiple trailers
  vehicle_type_id UUID REFERENCES public.vehicle_types(id),
  body_type_id UUID REFERENCES public.body_types(id),
  
  -- Sender/Loading info
  sender_name TEXT,
  loading_city TEXT,
  loading_state TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.collection_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view collection_orders" ON public.collection_orders FOR SELECT USING (true);
CREATE POLICY "Anyone can insert collection_orders" ON public.collection_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update collection_orders" ON public.collection_orders FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete collection_orders" ON public.collection_orders FOR DELETE USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_collection_orders_updated_at
BEFORE UPDATE ON public.collection_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
