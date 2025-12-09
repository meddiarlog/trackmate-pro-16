-- Add collection order number sequence field to company_settings
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS collection_order_start_number bigint DEFAULT 1;