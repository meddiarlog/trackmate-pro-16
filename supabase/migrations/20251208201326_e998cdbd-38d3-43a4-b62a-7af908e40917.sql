-- Add new fields to collection_orders table
ALTER TABLE public.collection_orders
ADD COLUMN IF NOT EXISTS issue_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS collection_date date,
ADD COLUMN IF NOT EXISTS freight_mode text;