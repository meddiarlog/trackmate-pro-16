

## Plano de Implementacao - Sistema Mutlog

---

## Resumo Executivo

Este plano abrange a implementacao de tres modulos principais e a correcao de um bug critico no sistema financeiro:

| Item | Tipo | Complexidade | Prioridade |
|------|------|--------------|------------|
| Correcao Bug Boleto (Contas a Pagar) | Bug Fix | Baixa | Alta |
| Modulo de Usuarios | Novo Modulo | Media | Alta |
| Modulo de Grupos de Usuarios | Novo Modulo | Baixa | Media |
| Modulo de Permissoes | Novo Modulo | Alta | Alta |

---

## 1. Correcao de Bug - Download/Visualizacao de Boleto

### 1.1 Problema Identificado

**Diagnostico:**
- O arquivo PDF existe e esta acessivel no Supabase Storage (verificado com sucesso)
- URL do boleto: `https://yojzaghwrznytnkksujw.supabase.co/storage/v1/object/public/boletos/boletos/1768825410730-f2ulix.pdf`
- O problema esta no codigo de download que usa `document.createElement('a')` - essa abordagem nao funciona corretamente com URLs externas devido a restricoes de CORS

**Codigo atual com problema (linhas 787-791):**
```typescript
onClick={() => {
  const link = document.createElement('a');
  link.href = account.boleto_file_url!;
  link.download = account.boleto_file_name || 'boleto';
  link.click();
}}
```

### 1.2 Solucao

Criar uma funcao `handleDownloadBoleto` que usa `fetch` com `blob` para fazer download:

```typescript
const handleDownloadBoleto = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    toast.success("Download iniciado!");
  } catch (error) {
    console.error('Download error:', error);
    toast.error("Erro ao baixar boleto");
  }
};
```

**Arquivo a modificar:** `src/pages/AccountsPayable.tsx`

---

## 2. Migracao de Banco de Dados

### 2.1 Novas Tabelas Necessarias

Seguindo as instrucoes de seguranca fornecidas (roles em tabela separada):

```sql
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
```

---

## 3. Modulo de Usuarios (`src/pages/AccessUsers.tsx`)

### 3.1 Interface e Funcionalidades

```
+--------------------------------------------------+
| Usuarios                                          |
+--------------------------------------------------+
| [+ Novo Usuario]    [Buscar: ____________]       |
+--------------------------------------------------+
| Nome      | Email           | Grupo    | Acoes   |
|-----------|-----------------|----------|---------|
| Joao      | joao@email.com  | Admin    | E | X   |
| Maria     | maria@email.com | Operador | E | X   |
+--------------------------------------------------+
```

### 3.2 Campos do Formulario

| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| Nome | text | Sim | Min 3 caracteres |
| Email | email | Sim | Formato valido, unico |
| Senha | password | Sim (novo) | Min 6 caracteres |
| Confirmar Senha | password | Sim (novo) | Igual a senha |
| Grupo | select | Nao | Referencia user_groups |
| Status | switch | Nao | Ativo/Inativo |

### 3.3 Funcoes Principais

- `fetchUsers()` - Listar usuarios com join em grupos
- `createUser()` - Criar usuario com hash de senha
- `updateUser()` - Atualizar dados (senha opcional)
- `deleteUser()` - Excluir usuario
- `validateEmail()` - Verificar duplicidade

### 3.4 Seguranca de Senhas

```typescript
// Usar hash no frontend antes de enviar (bcrypt via edge function)
const hashPassword = async (password: string): Promise<string> => {
  const response = await supabase.functions.invoke('hash-password', {
    body: { password }
  });
  return response.data.hash;
};
```

---

## 4. Modulo de Grupos de Usuarios (`src/pages/AccessUserGroups.tsx`)

### 4.1 Interface

```
+--------------------------------------------------+
| Grupos de Usuarios                                |
+--------------------------------------------------+
| [+ Novo Grupo]    [Buscar: ____________]         |
+--------------------------------------------------+
| Nome          | Descricao              | Acoes   |
|---------------|------------------------|---------|
| Administrador | Acesso total           | E | X   |
| Operador      | Acesso operacional     | E | X   |
+--------------------------------------------------+
```

### 4.2 Campos

| Campo | Tipo | Obrigatorio |
|-------|------|-------------|
| Nome | text | Sim |
| Descricao | textarea | Nao |

### 4.3 Validacoes

- Nome unico
- Nao excluir grupo com usuarios vinculados (mostrar alerta)

---

## 5. Modulo de Permissoes (`src/pages/AccessPermissions.tsx`)

### 5.1 Interface

```
+--------------------------------------------------+
| Permissoes                                        |
+--------------------------------------------------+
| Usuario: [Select Usuario v]                       |
+--------------------------------------------------+
| Modulo           | Ver | Criar | Editar | Excluir|
|------------------|-----|-------|--------|--------|
| Dashboard        | [x] | [ ]   | [ ]    | [ ]    |
| Clientes         | [x] | [x]   | [x]    | [ ]    |
| Motoristas       | [x] | [x]   | [ ]    | [ ]    |
| Financeiro       | [x] | [x]   | [x]    | [x]    |
+--------------------------------------------------+
| [Salvar Permissoes]                              |
+--------------------------------------------------+
```

### 5.2 Funcionalidades

1. **Selecao de Usuario**: Dropdown com todos os usuarios
2. **Listagem de Modulos**: Exibir todos os modulos do sistema
3. **Checkboxes de Permissao**: can_view, can_create, can_edit, can_delete
4. **Salvar em lote**: Atualizar todas as permissoes de uma vez

### 5.3 Logica de Salvamento

```typescript
const savePermissions = async () => {
  // Deletar permissoes existentes do usuario
  await supabase.from('user_permissions')
    .delete()
    .eq('user_id', selectedUserId);
  
  // Inserir novas permissoes
  const permissionsToInsert = modules
    .filter(m => m.can_view || m.can_create || m.can_edit || m.can_delete)
    .map(m => ({
      user_id: selectedUserId,
      module_id: m.id,
      can_view: m.can_view,
      can_create: m.can_create,
      can_edit: m.can_edit,
      can_delete: m.can_delete
    }));
  
  await supabase.from('user_permissions').insert(permissionsToInsert);
};
```

---

## 6. Correcao de Rotas

### 6.1 Inconsistencia Identificada

**AppSidebar.tsx (linha 117-121):**
```typescript
{ title: "Usuarios", url: "/access/users", icon: Users },
{ title: "Grupo de Usuarios", url: "/access/user-groups", icon: Users },
{ title: "Permissoes", url: "/access/permissions", icon: Shield },
```

**App.tsx (linha 93-100):**
```typescript
<Route path="account/access/users" element={<AccessUsers />} />
<Route path="account/access/user-groups" element={<AccessUserGroups />} />
<Route path="account/access/permissions" element={<AccessPermissions />} />
```

### 6.2 Solucao

Atualizar as rotas no `App.tsx` para corresponder ao sidebar:

```typescript
<Route path="access/users" element={<AccessUsers />} />
<Route path="access/user-groups" element={<AccessUserGroups />} />
<Route path="access/permissions" element={<AccessPermissions />} />
```

---

## 7. Edge Function para Hash de Senha

### 7.1 Criar `supabase/functions/hash-password/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { hash, compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password, hashToCompare, action } = await req.json();

    if (action === 'compare' && hashToCompare) {
      const isMatch = await compare(password, hashToCompare);
      return new Response(JSON.stringify({ isMatch }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hashedPassword = await hash(password);
    return new Response(JSON.stringify({ hash: hashedPassword }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## 8. Arquivos a Modificar/Criar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/AccountsPayable.tsx` | Modificar | Corrigir download de boleto |
| `src/pages/AccessUsers.tsx` | Reescrever | Modulo completo de usuarios |
| `src/pages/AccessUserGroups.tsx` | Reescrever | Modulo de grupos |
| `src/pages/AccessPermissions.tsx` | Reescrever | Modulo de permissoes |
| `src/App.tsx` | Modificar | Corrigir rotas |
| `supabase/functions/hash-password/index.ts` | Criar | Edge function para hash |
| `supabase/config.toml` | Modificar | Registrar nova edge function |
| Migracao SQL | Criar | Novas tabelas e dados |

---

## 9. Ordem de Implementacao

1. **Migracao de Banco de Dados** - Criar tabelas e inserir modulos
2. **Edge Function hash-password** - Implementar hash de senhas
3. **Corrigir Bug Boleto** - Atualizar AccountsPayable.tsx
4. **Corrigir Rotas** - Atualizar App.tsx
5. **Modulo Grupos de Usuarios** - Implementar CRUD simples
6. **Modulo Usuarios** - Implementar CRUD com validacoes
7. **Modulo Permissoes** - Implementar matriz de permissoes

---

## 10. Consideracoes de Seguranca

- Senhas armazenadas com hash bcrypt (nunca em texto plano)
- Roles em tabela separada (conforme instrucoes de seguranca)
- Funcao `has_role` com SECURITY DEFINER para evitar recursao RLS
- Validacao de email unico
- Estrutura preparada para autenticacao futura

