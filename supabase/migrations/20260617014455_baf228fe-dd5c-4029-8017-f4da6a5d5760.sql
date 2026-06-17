CREATE TABLE public.quote_origins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  city text,
  state text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_origins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_origins TO anon;
GRANT ALL ON public.quote_origins TO service_role;

ALTER TABLE public.quote_origins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quote_origins" ON public.quote_origins FOR SELECT USING (true);
CREATE POLICY "Anyone can insert quote_origins" ON public.quote_origins FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quote_origins" ON public.quote_origins FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete quote_origins" ON public.quote_origins FOR DELETE USING (true);

CREATE INDEX idx_quote_origins_quote_id ON public.quote_origins(quote_id);