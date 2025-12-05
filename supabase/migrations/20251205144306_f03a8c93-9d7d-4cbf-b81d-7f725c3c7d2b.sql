-- Add CTE reference column to boletos table
ALTER TABLE public.boletos ADD COLUMN cte_reference TEXT;