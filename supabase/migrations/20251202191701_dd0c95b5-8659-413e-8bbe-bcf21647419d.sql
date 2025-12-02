-- Add issue_date column to boletos table
ALTER TABLE public.boletos ADD COLUMN issue_date date NOT NULL DEFAULT CURRENT_DATE;