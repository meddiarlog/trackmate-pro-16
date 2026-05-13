## Máscara no campo Peso (KG) — Cotação

### Objetivo
Aplicar máscara de número brasileiro no campo **Peso (KG)** do formulário de Cotação. Ao digitar `2000`, exibir `2.000,00` (separador de milhar `.` e decimal `,`).

### Alteração

**Arquivo: `src/pages/Quotes.tsx`**
- Trocar o `<Input type="number">` do campo `weight_kg` por um `<Input type="text" inputMode="decimal">` com formatação dinâmica:
  - Enquanto o usuário digita, manter apenas dígitos.
  - Ao perder o foco (`onBlur`), formatar como `valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
  - Internamente, armazenar em `formData.weight_kg` o número como string com ponto decimal (ex.: `"2000.00"`) para manter o `parseFloat` na validação e no payload de salvamento funcionando como hoje.
- Na hora de exibir o valor no input (inclusive ao editar uma cotação existente), aplicar a mesma formatação BR.

### Sem mudanças
- Banco de dados: campo `weight_kg` continua `numeric`.
- Cálculo do subtotal de transporte e validações permanecem iguais.
- Outros campos numéricos do formulário não são alterados (escopo restrito ao Peso).
