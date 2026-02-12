
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payment_methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Anyone can insert payment_methods" ON public.payment_methods FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payment_methods" ON public.payment_methods FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete payment_methods" ON public.payment_methods FOR DELETE USING (true);

CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.payment_methods (name) VALUES
  ('Boleto'),
  ('Pix'),
  ('Transferência'),
  ('Depósito'),
  ('80% + SALDO'),
  ('Saldo'),
  ('A Combinar');
