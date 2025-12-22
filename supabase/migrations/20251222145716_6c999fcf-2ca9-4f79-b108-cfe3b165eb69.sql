-- Add pagador_id column to boletos table
ALTER TABLE public.boletos ADD COLUMN IF NOT EXISTS pagador_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_boletos_pagador_id ON public.boletos(pagador_id);