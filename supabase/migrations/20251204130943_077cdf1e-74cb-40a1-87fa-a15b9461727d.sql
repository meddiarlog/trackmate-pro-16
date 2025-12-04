-- Add type column to boletos table for different charge types
ALTER TABLE public.boletos 
ADD COLUMN type text NOT NULL DEFAULT 'boleto';

-- Add amount column to store the payment value
ALTER TABLE public.boletos 
ADD COLUMN amount numeric;