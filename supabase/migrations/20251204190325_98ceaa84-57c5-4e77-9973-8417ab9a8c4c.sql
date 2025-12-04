-- Make cash_box_id nullable in accounts_receivable and accounts_payable
ALTER TABLE public.accounts_receivable ALTER COLUMN cash_box_id DROP NOT NULL;
ALTER TABLE public.accounts_payable ALTER COLUMN cash_box_id DROP NOT NULL;