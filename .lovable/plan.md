# Múltiplos Destinatários na Ordem de Coleta

Atualmente cada Ordem de Coleta tem apenas 1 destinatário (campos diretos: `recipient_name`, `unloading_city`, `unloading_state` na tabela `collection_orders`). Vamos seguir o mesmo padrão usado para múltiplos produtos: criar uma tabela filha 1:N e manter os campos antigos como "destinatário primário" para compatibilidade.

## 1. Banco de Dados (migração)

Criar nova tabela `collection_order_recipients`:

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| collection_order_id | uuid NOT NULL | referência lógica (sem FK formal, segue padrão do projeto) |
| position | int NOT NULL default 0 | ordem de exibição / sequência de entrega |
| name | text NOT NULL | Nome / Razão Social |
| cpf_cnpj | text | |
| phone | text | |
| address | text | endereço completo (rua, nº, bairro) |
| city | text | |
| state | text | UF |
| cep | text | |
| created_at | timestamptz default now() | |

RLS: políticas públicas (mesmo padrão da `collection_order_products`).

Compatibilidade: registros antigos continuam usando `collection_orders.recipient_name / unloading_city / unloading_state`. Quando a tabela filha estiver vazia, a UI/impressão usam o destinatário legado como fallback (e ao editar, ele é convertido em primeiro item da lista).

## 2. Página `src/pages/CollectionOrders.tsx`

- Substituir os campos únicos de Destinatário/Descarregamento por uma seção **"Destinatários"** com lista dinâmica (similar ao padrão de Produtos já existente no mesmo formulário).
- Estrutura no `FormData`:
  ```ts
  recipients: Array<{
    name: string; cpf_cnpj: string; phone: string;
    address: string; city: string; state: string; cep: string;
  }>
  ```
  Inicial: 1 destinatário vazio (mínimo obrigatório).
- UI: usar **Accordion** (`@/components/ui/accordion`) com 1 item por destinatário. Header mostra `#1 — Nome (Cidade/UF)` + botão remover (desabilitado quando há só 1). Conteúdo do item: campos Nome/Razão Social*, CPF/CNPJ, Endereço, Bairro/CEP, Cidade*, UF*, Telefone.
- Botão "+ Adicionar destinatário" abaixo do accordion.
- Validação: nome, cidade e UF obrigatórios em **cada** destinatário antes de salvar (toast de erro indicando o índice).
- Carregamento ao editar: buscar `collection_order_recipients` por `collection_order_id` ordenado por `position`. Se vazio, montar 1 item com `recipient_name / unloading_city / unloading_state` legado.
- Salvamento (create/update):
  1. Salvar `collection_orders` mantendo os campos legados sincronizados com o **primeiro** destinatário (para compatibilidade com listas, relatórios e filtros existentes).
  2. `delete` em `collection_order_recipients where collection_order_id = X` e `insert` da lista atual com `position = índice`.
- Tabela de listagem (`FilterableTable`): coluna "Destinatário" passa a exibir o primeiro destinatário e, se houver mais, sufixo `(+N)`.

## 3. Impressão `src/components/CollectionOrderPrint.tsx`

- Adicionar `useQuery` para `collection_order_recipients` (mesmo padrão usado para produtos).
- Construir `displayRecipients` com fallback ao destinatário legado.
- Layout no bloco "DESCRIÇÃO DA ORDEM COLETADA":
  - **1 destinatário**: mantém layout atual (linhas DESTINATÁRIO e DESCARREGAMENTO).
  - **2+ destinatários**: substitui as duas linhas por uma tabela compacta:
    | # | Destinatário | CPF/CNPJ | Endereço | Cidade/UF | Telefone |
    Fonte reduz para `text-[10px]` quando >3 itens (igual produtos).

## 4. Compartilhamento WhatsApp

Atualizar geração de texto (se existir no fluxo de share) para listar todos os destinatários numerados.

## 5. Tipos

Após a migração, `src/integrations/supabase/types.ts` é regenerado automaticamente. Nenhuma edição manual.

## Arquivos afetados

- `supabase/migrations/<timestamp>_collection_order_recipients.sql` (novo)
- `src/pages/CollectionOrders.tsx` (formulário, mutations create/update, listagem)
- `src/components/CollectionOrderPrint.tsx` (busca + layout impressão)

## Compatibilidade & extras

- Ordens antigas continuam funcionando (fallback legado).
- Campo `position` já preparado para sequência de entrega/rota futura.
- Sem limite rígido de destinatários.
- Primeiro destinatário replicado nos campos legados garante que filtros, relatórios e busca por destinatário continuem funcionando sem mudanças adicionais.
