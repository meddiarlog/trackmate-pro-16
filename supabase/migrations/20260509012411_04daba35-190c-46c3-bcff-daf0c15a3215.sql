
CREATE TABLE public.banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  agency text,
  account text,
  wallet text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view banks" ON public.banks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert banks" ON public.banks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update banks" ON public.banks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete banks" ON public.banks FOR DELETE USING (true);

CREATE TRIGGER update_banks_updated_at
BEFORE UPDATE ON public.banks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.customers ADD COLUMN bank_id uuid;
ALTER TABLE public.boletos ADD COLUMN bank_id uuid;
