-- Add doc_number and tomador_id fields to ctes table
ALTER TABLE public.ctes 
ADD COLUMN IF NOT EXISTS doc_number text,
ADD COLUMN IF NOT EXISTS tomador_id uuid REFERENCES public.customers(id);