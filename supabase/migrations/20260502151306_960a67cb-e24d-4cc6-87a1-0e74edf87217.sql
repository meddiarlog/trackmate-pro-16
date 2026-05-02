CREATE TABLE public.collection_order_recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_order_id uuid NOT NULL,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  cpf_cnpj text,
  phone text,
  address text,
  city text,
  state text,
  cep text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_collection_order_recipients_order ON public.collection_order_recipients(collection_order_id);

ALTER TABLE public.collection_order_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collection_order_recipients"
ON public.collection_order_recipients FOR SELECT USING (true);

CREATE POLICY "Anyone can insert collection_order_recipients"
ON public.collection_order_recipients FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update collection_order_recipients"
ON public.collection_order_recipients FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete collection_order_recipients"
ON public.collection_order_recipients FOR DELETE USING (true);