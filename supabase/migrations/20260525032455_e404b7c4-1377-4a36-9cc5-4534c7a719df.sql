CREATE TABLE public.quote_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  name text,
  cpf_cnpj text,
  phone text,
  address text,
  city text,
  state text,
  cep text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_quote_recipients_quote_id ON public.quote_recipients(quote_id);

ALTER TABLE public.quote_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quote_recipients" ON public.quote_recipients FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quote_recipients" ON public.quote_recipients FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quote_recipients" ON public.quote_recipients FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete quote_recipients" ON public.quote_recipients FOR DELETE USING (true);