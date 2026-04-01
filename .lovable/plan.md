

## Plano - ID Sequencial no Controle de Credito

Adicionar coluna "ID" sequencial dinamica (baseada na posicao do item na lista filtrada/ordenada) na tabela e no dialog "Utilizar Credito".

### Alteracoes

| Arquivo | Acao |
|---------|------|
| `src/pages/CreditControl.tsx` | Adicionar coluna "ID" na tabela (apos checkbox, antes de NF-e); passar `sequentialId` aos selectedRecords |
| `src/components/UtilizarCreditoDialog.tsx` | Adicionar campo `sequentialId` ao tipo e exibir na listagem |

### Detalhes

**CreditControl.tsx:**
- Nova coluna apos "select" com `key: "sequentialId"`, header "ID", sem filtro
- O `render` usa o indice do item em `sortedFilteredData`: `sortedFilteredData.indexOf(item) + 1`
  - Alternativa mais eficiente: criar um `Map<string, number>` via `useMemo` mapeando `item.id -> index+1`
- Ao montar `selectedRecords`, incluir o `sequentialId` de cada registro a partir desse Map

**UtilizarCreditoDialog.tsx:**
- Adicionar `sequentialId?: number` ao tipo `CreditRecord`
- Exibir antes do numero NF-e: `ID: {record.sequentialId} | NF-e: {record.numero_nfe}`

Os IDs sao recalculados automaticamente quando filtros, ordenacao ou paginacao mudam, pois derivam da posicao no array `sortedFilteredData`.

