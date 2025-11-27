-- Create enum for payment methods
CREATE TYPE payment_method AS ENUM ('pix', 'boleto', 'transferencia');

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pendente', 'pago', 'vencido');

-- Create enum for cash movement types
CREATE TYPE cash_movement_type AS ENUM ('sangria', 'suprimento');

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  payment_method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pendente',
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash movements table
CREATE TABLE public.cash_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type cash_movement_type NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Anyone can view payments"
  ON public.payments
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update payments"
  ON public.payments
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete payments"
  ON public.payments
  FOR DELETE
  USING (true);

-- Create policies for cash_movements
CREATE POLICY "Anyone can view cash movements"
  ON public.cash_movements
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert cash movements"
  ON public.cash_movements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update cash movements"
  ON public.cash_movements
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete cash movements"
  ON public.cash_movements
  FOR DELETE
  USING (true);

-- Create trigger for automatic timestamp updates on payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better query performance
CREATE INDEX idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);
CREATE INDEX idx_cash_movements_type ON public.cash_movements(type);
CREATE INDEX idx_cash_movements_date ON public.cash_movements(date);