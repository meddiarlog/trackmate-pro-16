-- Adicionar campos necessários para o contrato de transporte na tabela ctes
ALTER TABLE public.ctes ADD COLUMN cfop text;
ALTER TABLE public.ctes ADD COLUMN cfop_description text;

-- Dados do remetente
ALTER TABLE public.ctes ADD COLUMN sender_name text;
ALTER TABLE public.ctes ADD COLUMN sender_cnpj text;
ALTER TABLE public.ctes ADD COLUMN sender_ie text;
ALTER TABLE public.ctes ADD COLUMN sender_address text;

-- Dados do destinatário
ALTER TABLE public.ctes ADD COLUMN recipient_name text;
ALTER TABLE public.ctes ADD COLUMN recipient_cnpj text;
ALTER TABLE public.ctes ADD COLUMN recipient_ie text;
ALTER TABLE public.ctes ADD COLUMN recipient_address text;

-- Seguradora
ALTER TABLE public.ctes ADD COLUMN insurance_company text;
ALTER TABLE public.ctes ADD COLUMN insurance_policy text;

-- Motorista
ALTER TABLE public.ctes ADD COLUMN driver_name text;
ALTER TABLE public.ctes ADD COLUMN driver_cpf text;
ALTER TABLE public.ctes ADD COLUMN driver_rg text;
ALTER TABLE public.ctes ADD COLUMN driver_rg_issuer text;
ALTER TABLE public.ctes ADD COLUMN driver_license text;
ALTER TABLE public.ctes ADD COLUMN driver_phone text;
ALTER TABLE public.ctes ADD COLUMN driver_cellphone text;
ALTER TABLE public.ctes ADD COLUMN driver_pis text;
ALTER TABLE public.ctes ADD COLUMN driver_city text;
ALTER TABLE public.ctes ADD COLUMN driver_state text;
ALTER TABLE public.ctes ADD COLUMN driver_bank text;
ALTER TABLE public.ctes ADD COLUMN driver_account text;
ALTER TABLE public.ctes ADD COLUMN driver_agency text;

-- Proprietário
ALTER TABLE public.ctes ADD COLUMN owner_name text;
ALTER TABLE public.ctes ADD COLUMN owner_cpf text;
ALTER TABLE public.ctes ADD COLUMN owner_rg text;
ALTER TABLE public.ctes ADD COLUMN owner_antt text;
ALTER TABLE public.ctes ADD COLUMN owner_pis text;
ALTER TABLE public.ctes ADD COLUMN owner_address text;

-- Veículo
ALTER TABLE public.ctes ADD COLUMN vehicle_plate text;
ALTER TABLE public.ctes ADD COLUMN vehicle_rntrc text;
ALTER TABLE public.ctes ADD COLUMN vehicle_renavam text;
ALTER TABLE public.ctes ADD COLUMN vehicle_city text;
ALTER TABLE public.ctes ADD COLUMN vehicle_state text;
ALTER TABLE public.ctes ADD COLUMN vehicle_brand text;
ALTER TABLE public.ctes ADD COLUMN vehicle_account text;
ALTER TABLE public.ctes ADD COLUMN vehicle_agency text;

-- Mercadoria
ALTER TABLE public.ctes ADD COLUMN cargo_species text;
ALTER TABLE public.ctes ADD COLUMN cargo_quantity numeric;
ALTER TABLE public.ctes ADD COLUMN cargo_invoice text;

-- Composição do frete
ALTER TABLE public.ctes ADD COLUMN freight_value numeric DEFAULT 0;
ALTER TABLE public.ctes ADD COLUMN toll_value numeric DEFAULT 0;
ALTER TABLE public.ctes ADD COLUMN advance_value numeric DEFAULT 0;
ALTER TABLE public.ctes ADD COLUMN insurance_value numeric DEFAULT 0;
ALTER TABLE public.ctes ADD COLUMN inss_value numeric DEFAULT 0;
ALTER TABLE public.ctes ADD COLUMN sest_senat_value numeric DEFAULT 0;
ALTER TABLE public.ctes ADD COLUMN other_discount_value numeric DEFAULT 0;
ALTER TABLE public.ctes ADD COLUMN breakage_value numeric DEFAULT 0;
ALTER TABLE public.ctes ADD COLUMN net_value numeric DEFAULT 0;

-- Observações
ALTER TABLE public.ctes ADD COLUMN observations text;