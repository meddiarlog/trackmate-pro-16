-- Allow CTEs to be created without a contract association
ALTER TABLE public.ctes ALTER COLUMN contract_id DROP NOT NULL;