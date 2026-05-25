## Adicionar máscaras de formatação nos campos dos destinatários

Aplicar máscaras automáticas (enquanto o usuário digita) nos campos **CPF/CNPJ**, **Telefone** e **CEP** dentro da seção de destinatários, tanto em **Ordem de Coleta** quanto em **Cotação**.

### Máscaras

- **CPF/CNPJ** (alterna conforme o tamanho dos dígitos):
  - até 11 dígitos: `000.000.000-00`
  - 12+ dígitos: `00.000.000/0000-00`
- **Telefone** (alterna conforme o tamanho):
  - 10 dígitos: `(00) 0000-0000`
  - 11 dígitos: `(00) 00000-0000`
- **CEP**: `00000-000`

Em todos os casos: remover não-dígitos, limitar ao tamanho máximo (14 para doc, 11 para telefone, 8 para CEP) e formatar progressivamente.

### Arquivos

1. **`src/lib/formatters.ts`** (novo) — utilitário central exportando `formatCpfCnpj`, `formatPhone`, `formatCep`. Reaproveitável e padroniza o código (hoje as funções estão duplicadas em vários arquivos).

2. **`src/pages/CollectionOrders.tsx`** — na seção de destinatários (Accordion, ~linhas 1066–1209), envolver os `onChange` dos inputs `cpf_cnpj`, `phone` e `cep` com a respectiva função de formatação importada de `@/lib/formatters`.

3. **`src/pages/Quotes.tsx`** — mesma aplicação no bloco de destinatários adicionado anteriormente (campos `cpf_cnpj`, `phone`, `cep` de cada item de `formData.recipients`).

### Regras adicionais

- Aplicar apenas nos campos dos destinatários — não alterar outros formulários neste passo (evita regressão).
- Preservar o valor já formatado vindo do banco ao editar (a função é idempotente: reaplica a máscara sobre dígitos extraídos).
- Sem mudanças de schema, sem mudanças visuais além da máscara.
