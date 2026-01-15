-- 1. Adicionar colunas de boleto em accounts_payable
ALTER TABLE accounts_payable 
ADD COLUMN IF NOT EXISTS boleto_file_name text,
ADD COLUMN IF NOT EXISTS boleto_file_url text;

-- 2. Criar bucket para comprovantes de contas a receber
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar políticas de storage para o bucket comprovantes
CREATE POLICY "Anyone can view comprovantes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'comprovantes');

CREATE POLICY "Anyone can upload comprovantes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'comprovantes');

CREATE POLICY "Anyone can update comprovantes" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'comprovantes');

CREATE POLICY "Anyone can delete comprovantes" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'comprovantes');

-- 4. Criar tabela para múltiplos comprovantes por registro de contas a receber
CREATE TABLE IF NOT EXISTS account_receivable_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_receivable_id uuid NOT NULL REFERENCES accounts_receivable(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  created_at timestamptz DEFAULT now()
);

-- 5. Habilitar RLS na tabela de attachments
ALTER TABLE account_receivable_attachments ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para a tabela de attachments
CREATE POLICY "Anyone can view account_receivable_attachments" 
ON account_receivable_attachments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert account_receivable_attachments" 
ON account_receivable_attachments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update account_receivable_attachments" 
ON account_receivable_attachments 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete account_receivable_attachments" 
ON account_receivable_attachments 
FOR DELETE 
USING (true);