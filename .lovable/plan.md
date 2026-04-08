

## Plano — Créditos Utilizados (Salvar, Listar, Editar, Excluir)

### Resumo

Adicionar funcionalidade para salvar conjuntos de NF-e selecionadas como "créditos utilizados", com nome/identificação definido pelo usuário. Criar listagem dos créditos salvos com visualização, edição e exclusão.

### 1. Banco de Dados — 2 novas tabelas

**`saved_credits`** — cabeçalho do crédito salvo
| Coluna | Tipo | Obs |
|--------|------|-----|
| id | uuid PK | gen_random_uuid() |
| name | text NOT NULL | nome/identificação (unique) |
| total_credit | numeric NOT NULL | valor total |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

**`saved_credit_items`** — itens vinculados
| Coluna | Tipo | Obs |
|--------|------|-----|
| id | uuid PK | gen_random_uuid() |
| saved_credit_id | uuid FK → saved_credits.id ON DELETE CASCADE | |
| credit_control_id | uuid | referência ao registro em credit_control |
| numero_nfe | text | |
| cnpj_emitente | text | |
| razao_social | text | |
| credito | numeric | |
| chave_acesso | text | |

RLS: políticas públicas (mesmo padrão das demais tabelas do projeto).

### 2. Alterações no `UtilizarCreditoDialog.tsx`

- Adicionar botão **"Salvar Crédito Utilizado"** no DialogFooter (ao lado de "Fechar").
- Ao clicar, abrir um mini-dialog/modal pedindo o **nome** do crédito.
- Validar duplicidade de nome antes de salvar.
- Ao confirmar, inserir em `saved_credits` + `saved_credit_items` (uma linha por NF-e selecionada).
- Exibir toast de sucesso e fechar o dialog.
- Receber callback `onCreditSaved` para atualizar a listagem na página pai.

### 3. Alterações no `CreditControl.tsx`

- Adicionar estado e fetch para carregar `saved_credits` (com contagem de itens).
- Criar seção **"Créditos Salvos"** abaixo dos cards de resumo e acima da tabela, com:
  - Lista em cards compactos: nome, valor total, data de criação.
  - Botão **Visualizar** → abre dialog mostrando as NF-e vinculadas.
  - Botão **Editar** → permite alterar nome; abre dialog com campo de nome editável.
  - Botão **Excluir** → confirmação + delete cascade.
- Passar callback `onCreditSaved` para o `UtilizarCreditoDialog`.

### 4. Novo componente `SavedCreditsSection.tsx`

Componente dedicado para a listagem dos créditos salvos, contendo:
- Fetch de `saved_credits` com join em `saved_credit_items`.
- Card por crédito salvo com nome, total e ações.
- Dialog de detalhes (lista de NF-e ao clicar).
- Dialog de edição de nome.
- Confirmação de exclusão via `window.confirm` ou AlertDialog.

### Fluxo do Usuário

```text
Seleciona NF-e → "Utilizar Crédito" → Dialog abre
  → "Salvar Crédito Utilizado" → Informa nome → Confirma
  → Crédito salvo aparece na seção "Créditos Salvos"
  → Pode clicar para ver NF-e, editar nome ou excluir
```

### Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabelas `saved_credits` e `saved_credit_items` |
| `src/components/UtilizarCreditoDialog.tsx` | Adicionar botão + modal de nome |
| `src/pages/CreditControl.tsx` | Integrar seção de créditos salvos |
| `src/components/SavedCreditsSection.tsx` | Novo componente (listagem + CRUD) |

