-- Enum para roles do sistema
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'viewer');

-- Tabela de grupos de usuarios
CREATE TABLE public.user_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela de usuarios do sistema
CREATE TABLE public.system_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  group_id uuid REFERENCES public.user_groups(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true NOT NULL,
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela de roles (separada por seguranca)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.system_users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela de modulos do sistema
CREATE TABLE public.system_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  description text,
  parent_id uuid REFERENCES public.system_modules(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabela de permissoes por usuario e modulo
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.system_users(id) ON DELETE CASCADE NOT NULL,
  module_id uuid REFERENCES public.system_modules(id) ON DELETE CASCADE NOT NULL,
  can_view boolean DEFAULT false NOT NULL,
  can_create boolean DEFAULT false NOT NULL,
  can_edit boolean DEFAULT false NOT NULL,
  can_delete boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id, module_id)
);

-- Habilitar RLS
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Policies para acesso publico (temporario, ate implementar auth)
CREATE POLICY "Allow all access to user_groups" ON public.user_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to system_users" ON public.system_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to user_roles" ON public.user_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to system_modules" ON public.system_modules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to user_permissions" ON public.user_permissions FOR ALL USING (true) WITH CHECK (true);

-- Funcao para verificar role (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Inserir modulos do sistema
INSERT INTO public.system_modules (name, code, description, display_order) VALUES
  ('Dashboard', 'dashboard', 'Painel principal', 1),
  ('Cadastro', 'cadastro', 'Modulo de cadastros', 2),
  ('Clientes', 'customers', 'Cadastro de clientes', 3),
  ('Motoristas', 'drivers', 'Cadastro de motoristas', 4),
  ('Veiculos', 'vehicles', 'Cadastro de veiculos', 5),
  ('Fornecedores', 'suppliers', 'Cadastro de fornecedores', 6),
  ('Produtos', 'products', 'Cadastro de produtos', 7),
  ('Servicos', 'servicos', 'Modulo de servicos', 8),
  ('Fretes', 'freights', 'Gestao de fretes', 9),
  ('Ordens de Coleta', 'collection-orders', 'Ordens de coleta', 10),
  ('CTE', 'cte', 'Conhecimentos de transporte', 11),
  ('Contratos', 'contracts', 'Gestao de contratos', 12),
  ('MDF-e', 'mdfe', 'Manifestos de carga', 13),
  ('Cotacoes', 'quotes', 'Gestao de cotacoes', 14),
  ('Financeiro', 'financeiro', 'Modulo financeiro', 15),
  ('Controle de Caixa', 'cash-boxes', 'Controle de caixa', 16),
  ('Contas a Pagar', 'accounts-payable', 'Contas a pagar', 17),
  ('Contas a Receber', 'accounts-receivable', 'Contas a receber', 18),
  ('Cobrancas', 'cobrancas', 'Gestao de cobrancas', 19),
  ('Controle de Credito', 'credit-control', 'Controle de credito', 20),
  ('Relatorios', 'reports', 'Modulo de relatorios', 21),
  ('Repositorio', 'repository', 'Repositorio de arquivos', 22),
  ('Configuracoes', 'settings', 'Configuracoes do sistema', 23),
  ('Gestao de Acessos', 'access', 'Gestao de usuarios e permissoes', 24);

-- Trigger para updated_at
CREATE TRIGGER update_user_groups_updated_at
  BEFORE UPDATE ON public.user_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_users_updated_at
  BEFORE UPDATE ON public.system_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();