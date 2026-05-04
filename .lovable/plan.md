# Reverter destinatários para digitação livre

A integração anterior adicionou um `CustomerSearchSelect` em cada destinatário da Ordem de Coleta. Conforme o pedido, os destinatários voltam a ser de digitação livre — sem buscar nada na tabela de Clientes. Apenas o campo **UF** permanece como lista de seleção (já está assim hoje). A possibilidade de adicionar múltiplos destinatários é mantida.

## Mudanças

### `src/pages/CollectionOrders.tsx`

1. **Remover o componente de busca**: apagar o bloco `<CustomerSearchSelect ... />` que aparece no topo de cada item do accordion de destinatários (linhas ~1141–1163), incluindo o label "Buscar em Clientes" e o `onChange` que auto-preenche os campos.

2. **Remover o import** de `CustomerSearchSelect` no topo do arquivo (linha 22).

3. **Remover a query** `customers-recipient-lookup` (linhas ~357–371) e a variável `customers` derivada — não é mais usada por este formulário.

4. **Manter intactos**:
   - Os inputs de digitação livre: Nome / Razão Social, CPF/CNPJ, Telefone, Endereço, Cidade, CEP.
   - O `Select` de UF com a lista de estados.
   - Botão "Adicionar destinatário" e a remoção de destinatários.
   - A sincronização com os campos legados (`recipient_name`, `unloading_city`, `unloading_state`) baseada no primeiro destinatário.
   - A persistência em `collection_order_recipients` e a impressão (`CollectionOrderPrint.tsx`).

### Sem mudanças em banco

A estrutura `collection_order_recipients` continua igual. Nenhuma migração necessária.

### Sem mudanças em impressão

Os mesmos campos continuam sendo gravados — a impressão não muda.

## Arquivos afetados

- `src/pages/CollectionOrders.tsx` — remover import, query de customers e o bloco `CustomerSearchSelect` de cada destinatário.
