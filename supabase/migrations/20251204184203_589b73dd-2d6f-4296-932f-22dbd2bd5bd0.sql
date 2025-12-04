-- Create cash_categories table
CREATE TABLE public.cash_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cash_categories" ON public.cash_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can insert cash_categories" ON public.cash_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update cash_categories" ON public.cash_categories FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete cash_categories" ON public.cash_categories FOR DELETE USING (true);

-- Create cash_boxes table
CREATE TABLE public.cash_boxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.cash_categories(id) ON DELETE CASCADE,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cash_boxes" ON public.cash_boxes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert cash_boxes" ON public.cash_boxes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update cash_boxes" ON public.cash_boxes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete cash_boxes" ON public.cash_boxes FOR DELETE USING (true);

-- Create accounts_receivable table
CREATE TABLE public.accounts_receivable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_box_id UUID NOT NULL REFERENCES public.cash_boxes(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  document_number TEXT,
  installments INTEGER NOT NULL DEFAULT 1,
  installment_number INTEGER NOT NULL DEFAULT 1,
  due_date DATE NOT NULL,
  payment_date DATE,
  amount NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  penalty_interest NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'boleto',
  is_fixed_income BOOLEAN NOT NULL DEFAULT false,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  parent_id UUID REFERENCES public.accounts_receivable(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view accounts_receivable" ON public.accounts_receivable FOR SELECT USING (true);
CREATE POLICY "Anyone can insert accounts_receivable" ON public.accounts_receivable FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update accounts_receivable" ON public.accounts_receivable FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete accounts_receivable" ON public.accounts_receivable FOR DELETE USING (true);

-- Create accounts_payable table
CREATE TABLE public.accounts_payable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_box_id UUID NOT NULL REFERENCES public.cash_boxes(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  document_number TEXT,
  installments INTEGER NOT NULL DEFAULT 1,
  installment_number INTEGER NOT NULL DEFAULT 1,
  due_date DATE NOT NULL,
  payment_date DATE,
  amount NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  penalty_interest NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'boleto',
  is_fixed_expense BOOLEAN NOT NULL DEFAULT false,
  observations TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  parent_id UUID REFERENCES public.accounts_payable(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view accounts_payable" ON public.accounts_payable FOR SELECT USING (true);
CREATE POLICY "Anyone can insert accounts_payable" ON public.accounts_payable FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update accounts_payable" ON public.accounts_payable FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete accounts_payable" ON public.accounts_payable FOR DELETE USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_cash_categories_updated_at
  BEFORE UPDATE ON public.cash_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_boxes_updated_at
  BEFORE UPDATE ON public.cash_boxes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_receivable_updated_at
  BEFORE UPDATE ON public.accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_payable_updated_at
  BEFORE UPDATE ON public.accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();