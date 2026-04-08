
-- Create saved_credits table
CREATE TABLE public.saved_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  total_credit numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create saved_credit_items table
CREATE TABLE public.saved_credit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_credit_id uuid NOT NULL REFERENCES public.saved_credits(id) ON DELETE CASCADE,
  credit_control_id uuid,
  numero_nfe text,
  cnpj_emitente text,
  razao_social text,
  credito numeric,
  chave_acesso text
);

-- Enable RLS
ALTER TABLE public.saved_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_credit_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_credits
CREATE POLICY "Anyone can view saved_credits" ON public.saved_credits FOR SELECT USING (true);
CREATE POLICY "Anyone can insert saved_credits" ON public.saved_credits FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update saved_credits" ON public.saved_credits FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete saved_credits" ON public.saved_credits FOR DELETE USING (true);

-- RLS policies for saved_credit_items
CREATE POLICY "Anyone can view saved_credit_items" ON public.saved_credit_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert saved_credit_items" ON public.saved_credit_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update saved_credit_items" ON public.saved_credit_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete saved_credit_items" ON public.saved_credit_items FOR DELETE USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_saved_credits_updated_at
  BEFORE UPDATE ON public.saved_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
