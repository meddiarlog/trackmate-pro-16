## Máscara de moeda nos campos de Valores — Cotação

### Objetivo
Aplicar a mesma máscara pt-BR (digitar `2500` → exibir `2.500,00`) nos quatro campos da seção **Valores** do formulário de Cotação:
- Valor de Frete (R$ ou R$/Ton)
- Valor de Serviço de Munck (R$)
- Valor de Carregamento (R$)
- Valor de Descarga (R$)

### Alteração

**Arquivo: `src/pages/Quotes.tsx`**
- Trocar os quatro `<Input type="number">` por `<Input type="text" inputMode="decimal">` usando o mesmo padrão já aplicado em **Peso (KG)**:
  - `value` exibido via `parseFloat(formData.<campo>).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
  - `onChange` extrai apenas dígitos, divide por 100 e armazena como string com ponto decimal (ex.: `"2500.00"`), mantendo `parseFloat` no payload de salvamento e nos cálculos.
- Criar um pequeno helper local (`formatCurrencyInput` / `parseCurrencyInput`) dentro do arquivo para evitar repetição de código nos quatro inputs.

### Sem mudanças
- Banco de dados, validações, cálculo de subtotal de transporte e total geral permanecem iguais — apenas a UX dos inputs muda.
- Outros formulários do sistema não são tocados.
