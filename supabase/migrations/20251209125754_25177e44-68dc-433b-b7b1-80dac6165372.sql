-- Alter order_number column to bigint to support larger sequence numbers
ALTER TABLE public.collection_orders 
ALTER COLUMN order_number TYPE bigint;