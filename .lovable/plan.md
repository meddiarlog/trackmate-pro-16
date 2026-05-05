# Ordem de Coleta — Destinatários: Nome e Cidade opcionais

Tornar os campos **Nome / Razão Social** e **Cidade** dos destinatários opcionais, mantendo todos os demais comportamentos do módulo.

## 1. Banco de dados

Criar migration para alterar a constraint `NOT NULL` da coluna `name` na tabela `collection_order_recipients`.

```sql
ALTER TABLE public.collection_order_recipients
  ALTER COLUMN name DROP NOT NULL;
```

- `city` já é nullable (não precisa de alteração).
- RLS policies permanecem inalteradas.

## 2. Frontend — UI

Em `src/pages/CollectionOrders.tsx` (seção do accordion de destinatários):

- **Linha ~1127**: Alterar label de `Nome / Razão Social *` para `Nome / Razão Social`.
- **Linha ~1176**: Alterar label de `Cidade *` para `Cidade`.
- Manter `UF *` como está.

## 3. Frontend — Validação do submit (`handleSubmit`)

Na função `handleSubmit` (linhas ~818-832):

- **Remover** o bloco que exige `name` preenchido:
  ```typescript
  if (!r.name || !r.name.trim()) {
    toast.error(`Destinatário #${i + 1}: informe o nome / razão social`);
    return;
  }
  ```
- **Remover** o bloco que exige `city` preenchida:
  ```typescript
  if (!r.city || !r.city.trim()) {
    toast.error(`Destinatário #${i + 1}: informe a cidade`);
    return;
  }
  ```
- Manter a validação de `state` (UF) obrigatório e a verificação de existência de pelo menos um destinatário.

## 4. Frontend — Critério de persistência dos destinatários

Atualmente o código filtra destinatários exigindo `name` preenchido. Como `name` passa a ser opcional, o critério deve mudar para: persistir o destinatário se **pelo menos um campo** estiver preenchido.

Alterar em dois lugares:

- **`createOrderMutation`** (linha ~484):
  ```typescript
  .filter(r => [r.name, r.cpf_cnpj, r.phone, r.address, r.city, r.state, r.cep]
    .some(v => v && v.trim() !== ""))
  ```

- **`updateOrderMutation`** (linha ~586):
  Aplicar o mesmo filtro acima.

## 5. Tipos do Supabase

O arquivo `src/integrations/supabase/types.ts` é gerado automaticamente e **não deve ser editado manualmente**. Após a migration ser aplicada, os tipos serão atualizados automaticamente.

## Arquivos afetados

- `supabase/migrations/` — nova migration com `ALTER TABLE`
- `src/pages/CollectionOrders.tsx` — labels, validação e filtros de persistência
