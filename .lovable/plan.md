## Plano — Impressão de Múltiplos Produtos na Ordem de Coleta

### Resumo
Atualizar a tela de impressão (`CollectionOrderPrint.tsx`) para listar **todos os produtos** vinculados à ordem (tabela `collection_order_products`), em vez de apenas o produto legado único.

### Abordagem

1. **Buscar produtos no print component** — Adicionar uma query no `CollectionOrderPrint.tsx` que carrega da tabela `collection_order_products` (com join em `products(name)`) usando o `order.id`, ordenado por `position`.
   - Fallback: se não houver itens (ordem legada), usa `order.products?.name` com quantidade `order.weight_tons` ou 1.

2. **Renderização na seção "DESCRIÇÃO DA ORDEM COLETADA"**:
   - Substituir a célula atual `PRODUTO: {order.products?.name}` por uma listagem.
   - **Se houver 1 produto**: mantém o layout atual (uma linha "PRODUTO: Nome — Qtd").
   - **Se houver múltiplos produtos**: renderiza uma mini-tabela com colunas `Produto | Qtd | Obs`, ocupando a largura completa (col-span-2) acima da linha do TIPO.

   Layout proposto quando >1 produto:
   ```text
   ┌─────────────────────────────────────────────┐
   │ PRODUTOS:                                   │
   │  • Nome A          2.5    Obs A             │
   │  • Nome B          1.0    Obs B             │
   │  • Nome C          3.0    -                 │
   └─────────────────────────────────────────────┘
   ```

3. **Compatibilidade de impressão**:
   - Manter mesmo padrão visual (bordas, tipografia, `text-sm`).
   - Garantir que quebras não estourem a página (lista compacta com `text-xs` se >3 produtos).

### Arquivo Afetado

| Arquivo | Ação |
|---------|------|
| `src/components/CollectionOrderPrint.tsx` | Adicionar query a `collection_order_products` e renderizar lista de produtos |

### Resultado Esperado
- Ordens com 1 produto: impressão idêntica à atual.
- Ordens com múltiplos produtos: cada produto aparece com nome, quantidade e observação na impressão.
- Ordens legadas (sem itens em `collection_order_products`): continuam exibindo o produto único antigo.
