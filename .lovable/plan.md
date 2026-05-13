## Melhoria em Cotação — Prazo de Entrega

### Objetivo
1. Tornar o campo **Prazo de Entrega** um input numérico digitável (igual a Validade da Proposta), em vez de dropdown com opções fixas de 0 a 50.
2. Incluir o **Prazo de Entrega** na impressão da proposta.

### Alterações

**Arquivo: `src/pages/Quotes.tsx`**
- Substituir o componente `<Select>` do campo **Prazo de Entrega** por um `<Input type="number" min="0" max="365">`, com o mesmo padrão dos campos *Validade da Proposta* e *Prazo de Pagamento*.
- Remover a constante `deliveryDaysOptions` que alimentava o dropdown (não será mais necessária).

**Arquivo: `src/components/QuotePrintView.tsx`**
- Adicionar o campo **Prazo de Entrega** na seção "Condições da Proposta", exibindo `{quote.delivery_days || 0} dias`.

### Sem mudanças no banco de dados
O campo `delivery_days` já existe como inteiro na tabela `quotes`; apenas a UI do formulário e o layout de impressão serão ajustados.