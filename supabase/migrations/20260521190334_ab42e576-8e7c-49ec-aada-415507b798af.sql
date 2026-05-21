
ALTER TABLE public.accounts_receivable
  ADD COLUMN IF NOT EXISTS invoice_number text;

CREATE UNIQUE INDEX IF NOT EXISTS accounts_receivable_invoice_number_unique
  ON public.accounts_receivable (invoice_number)
  WHERE invoice_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix text;
  v_next int;
  v_result text;
BEGIN
  v_prefix := to_char(now(), 'MM') || to_char(now(), 'YYYY');

  SELECT COALESCE(MAX(substring(invoice_number from 7 for 5)::int), 0) + 1
    INTO v_next
    FROM public.accounts_receivable
   WHERE invoice_number LIKE v_prefix || '%'
     AND length(invoice_number) = 11;

  v_result := v_prefix || lpad(v_next::text, 5, '0');
  RETURN v_result;
END;
$$;
