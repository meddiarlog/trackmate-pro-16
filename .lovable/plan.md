## Plano — Corrigir impressão para mostrar todos os produtos da Ordem de Coleta

### Problema identificado

Verifiquei o banco e a ordem `20251200199` realmente possui 2 produtos vinculados (ARGAMASSA + CIMENTO) na tabela `collection_order_products`. Porém, na impressão aparece apenas o primeiro com layout antigo ("PRODUTO: ARGAMASSA — Qtd: 20").

**Causa raiz**: No `CollectionOrderPrint.tsx`, a query usa o embed PostgREST `products(name)` em `collection_order_products`. Como essa tabela **não tem foreign key declarada** para `products` (confirmado no schema), o embed retorna `null` no campo `products`, fazendo `displayProducts` ficar vazio. Como fallback, o código cai na ramificação legada `order.products?.name`, exibindo apenas 1 produto.

### Correção

Substituir o embed por uma query manual em duas etapas no `CollectionOrderPrint.tsx`:

1. Buscar itens em `collection_order_products` (sem join).
2. Buscar nomes em `products` via `.in("id", productIds)`.
3. Mapear `product_id → name` localmente.

Com isso, `displayProducts` será populado corretamente e o renderizador (que já trata `length > 1` com mini-tabela Produto/Qtd/Obs) exibirá todos os produtos.

### Arquivo afetado

| Arquivo | Ação |
|---------|------|
| `src/components/CollectionOrderPrint.tsx` | Trocar embed `products(name)` por lookup manual com `in()` |

### Resultado esperado

- Ordens com múltiplos produtos: tabela com todos os produtos (nome, qtd, observação) na impressão.
- Ordens com 1 produto: mantém layout original.
- Ordens legadas (sem itens em `collection_order_products`): continuam usando o produto antigo.
