## Plano — Múltiplos Produtos por Ordem de Coleta

### Resumo

Tornar a Ordem de Coleta capaz de conter vários produtos (relação 1:N), cada um com **produto**, **quantidade** e **observação opcional**. Adicionar/remover itens dinamicamente no formulário, com validação mínima de 1 item. Manter compatibilidade com ordens antigas que usam `product_id`.

### 1. Banco de Dados — Nova tabela

Criar `collection_order_products`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | gen_random_uuid() |
| `collection_order_id` | uuid NOT NULL | referência à ordem |
| `product_id` | uuid NOT NULL | referência ao produto |
| `quantity` | numeric NOT NULL | quantidade (suporta decimal) |
| `observation` | text NULL | observação opcional |
| `position` | integer NOT NULL DEFAULT 0 | ordem de exibição |
| `created_at` | timestamptz DEFAULT now() | |

- Índice em `collection_order_id`
- RLS pública (mesmo padrão das outras tabelas do projeto)

A coluna `collection_orders.product_id` permanece (compatibilidade com ordens antigas), mas deixa de ser usada por novas ordens.

### 2. Migração de dados existentes

Para cada `collection_orders` com `product_id NOT NULL`, inserir uma linha em `collection_order_products` com `quantity = 1` e `observation = NULL`. Garante que ordens antigas apareçam com seu produto na nova UI.

### 3. Frontend — `src/pages/CollectionOrders.tsx`

**Tipo `FormData`**: substituir `product_id: string` por:
```ts
products: Array<{ product_id: string; quantity: number; observation: string }>
```
Inicial: `[{ product_id: "", quantity: 1, observation: "" }]`.

**UI no diálogo** (substitui o bloco atual "Produto"):
- Card "Produtos" com lista de linhas. Cada linha: `Select` de produto (com botão "+" de cadastro reaproveitado) + `Input` numérico de quantidade + `Input` de observação + botão lixeira para remover.
- Botão "+ Adicionar Produto" abaixo da lista.
- Lixeira desabilitada quando há apenas 1 item.

**Validação** em `handleSubmit`: pelo menos um item com `product_id` preenchido e `quantity > 0`; senão `toast.error`.

**Salvar (create/update)**:
1. Insert/update na `collection_orders` (sem `product_id`).
2. Em update: `delete from collection_order_products where collection_order_id = X`.
3. `insert` em lote dos itens válidos do formulário com `position` = índice.

**Edição**: ao abrir, buscar `collection_order_products` da ordem e popular `formData.products`. Se vier vazio mas `order.product_id` existir, popular com 1 item dessa ordem antiga (fallback de compatibilidade).

**Listagem da tabela**: nenhuma mudança obrigatória. Opcionalmente exibir contagem de itens — fora do escopo desta entrega.

### 4. Impressão

`CollectionOrderPrint.tsx` não referencia produto atualmente, então **não precisa de alteração** nesta etapa.

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Nova migration SQL | Criar tabela `collection_order_products` + migrar dados existentes |
| `src/pages/CollectionOrders.tsx` | Refatorar formulário, mutations create/update, edição |

### Resultado esperado

- Usuário pode adicionar N produtos a uma ordem, com quantidade e observação.
- Botões claros de adicionar e remover.
- Validação impede salvar sem produto.
- Ordens antigas continuam funcionando (produto único migrado automaticamente).
