CREATE TABLE public.collection_order_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  observation text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_collection_order_products_order ON public.collection_order_products(collection_order_id);

ALTER TABLE public.collection_order_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collection_order_products" ON public.collection_order_products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert collection_order_products" ON public.collection_order_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update collection_order_products" ON public.collection_order_products FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete collection_order_products" ON public.collection_order_products FOR DELETE USING (true);

-- Migrar dados existentes: para cada ordem com product_id, criar 1 item
INSERT INTO public.collection_order_products (collection_order_id, product_id, quantity, position)
SELECT id, product_id, COALESCE(weight_tons, 1), 0
FROM public.collection_orders
WHERE product_id IS NOT NULL;