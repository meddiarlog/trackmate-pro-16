## Resumo

Reorganizar o menu de Configurações, criar novo cadastro de **Bancos** (para geração de boletos), vincular um banco padrão ao cliente e auto-preencher esse banco no módulo Cobranças.

---

## 1. Banco de Dados

**Nova tabela `banks`** (cadastro de bancos para emissão de boletos):
- `name` (texto, obrigatório) — nome do banco
- `code` (texto, opcional) — código FEBRABAN (ex: 001, 237, 341)
- `agency` (texto, opcional)
- `account` (texto, opcional)
- `wallet` (texto, opcional) — carteira
- `is_active` (boolean, default true)
- RLS pública (mesmo padrão das demais tabelas do projeto)

**Tabela `customers`**: adicionar coluna `bank_id uuid` (opcional, sem FK rígida — segue padrão das outras relações do projeto).

---

## 2. Reorganização do Menu (`src/components/AppSidebar.tsx`)

Estrutura nova de Configurações:

```text
Configurações
├── Dados da Empresa        → /settings/company  (mantém)
└── Conf. Financeiro
    ├── Bancos              → /settings/banks    (NOVO)
    └── Forma de Pgto.      → /settings/payment-methods (mantém)
```

- Remover item "Unidades" do menu.
- Remover rota `/settings/units` em `App.tsx`.
- Excluir `src/pages/SettingsUnits.tsx`.
- "Conf. Financeiro" será apenas um agrupador (collapsible), sem rota própria.

---

## 3. Novo Módulo: Bancos

**Página `src/pages/Banks.tsx`** + rota `/settings/banks` em `App.tsx`.

Funcionalidades (padrão dos demais cadastros do projeto):
- Listagem em `FilterableTable` com colunas: Nome, Código, Agência, Conta, Carteira, Status, Ações (☰).
- Dialog de criar/editar banco.
- Excluir com confirmação.
- Toggle ativo/inativo.

---

## 4. Cliente: campo "Banco para geração de boleto"

Em `src/components/CustomerFormDialog.tsx` (e/ou `src/pages/Customers.tsx`):
- Adicionar Select **opcional** "Banco para geração de boleto" listando bancos ativos da tabela `banks`.
- Persistir em `customers.bank_id`.
- Exibir banco selecionado na visualização do cliente.

---

## 5. Cobranças: auto-preenchimento do banco

Em `src/pages/Cobrancas.tsx`:
- Ao selecionar um cliente (via `CustomerSearchSelect`), buscar `bank_id` do cliente e preencher automaticamente o campo "Banco" da cobrança.
- Campo permanece **editável** — usuário pode trocar manualmente.
- Adicionar coluna `bank_id` em `boletos` para registrar o banco usado em cada cobrança.

---

## 6. Permissões / Memória

- Atualizar `mem://architecture/system-modules-registry` com o novo módulo "Bancos".
- Atualizar `mem://architecture/sidebar-and-action-menu-standardization` e `mem://features/payment-methods-registry` refletindo a nova hierarquia de Configurações.

---

## Arquivos afetados (resumo)

- **Migração SQL**: criar `banks`, adicionar `customers.bank_id`, adicionar `boletos.bank_id`.
- **Novos**: `src/pages/Banks.tsx`.
- **Editar**: `src/App.tsx`, `src/components/AppSidebar.tsx`, `src/components/CustomerFormDialog.tsx`, `src/pages/Customers.tsx`, `src/pages/Cobrancas.tsx`.
- **Excluir**: `src/pages/SettingsUnits.tsx`.
