-- Adicionar coluna nome_fantasia na tabela customers
ALTER TABLE public.customers 
ADD COLUMN nome_fantasia TEXT;

-- Adicionar coluna responsavel na tabela customer_contacts
ALTER TABLE public.customer_contacts 
ADD COLUMN responsavel TEXT;