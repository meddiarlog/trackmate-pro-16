-- Add order_number_type to collection_orders
ALTER TABLE collection_orders 
ADD COLUMN IF NOT EXISTS order_number_type TEXT DEFAULT 'pedido';

-- Add missing columns to suppliers
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS responsavel TEXT,
ADD COLUMN IF NOT EXISTS prazo_dias INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Create supplier_contacts table
CREATE TABLE IF NOT EXISTS supplier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'comercial',
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on supplier_contacts
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for supplier_contacts
CREATE POLICY "Anyone can view supplier_contacts" ON supplier_contacts FOR SELECT USING (true);
CREATE POLICY "Anyone can insert supplier_contacts" ON supplier_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update supplier_contacts" ON supplier_contacts FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete supplier_contacts" ON supplier_contacts FOR DELETE USING (true);

-- Add UPDATE and DELETE policies for vehicle_types
CREATE POLICY "Anyone can update vehicle_types" ON vehicle_types FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete vehicle_types" ON vehicle_types FOR DELETE USING (true);

-- Add UPDATE and DELETE policies for body_types
CREATE POLICY "Anyone can update body_types" ON body_types FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete body_types" ON body_types FOR DELETE USING (true);