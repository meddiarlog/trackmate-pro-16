## Fallback do banco do cliente nas Cobranças

### Diagnóstico

O auto-preenchimento do banco só acontece em `handleCustomerChange`, ou seja, quando o cliente é selecionado/alterado dentro do diálogo. Cobranças criadas antes do recurso (ou cujo cliente teve o banco vinculado depois) ficaram com `boletos.bank_id = null`. Por isso, ao editar a cobrança da Granphos a tela mostra "Nenhum" e a coluna **Banco** na listagem aparece vazia, mesmo o cliente já tendo o banco Cora cadastrado.

### Correção (somente frontend, sem migrar dados)

Tratar o `bank_id` do cliente como **fallback** sempre que a cobrança não tiver banco próprio.

Alterações em `src/pages/Cobrancas.tsx`:

1. **Listagem (coluna Banco)** — ao montar `transformedCobrancas`, resolver o banco assim:
   - usar `cobranca.bank_id`; se vazio, buscar o cliente em `customers` pelo `customer_id` e usar `customer.bank_id`;
   - exibir o nome (com código quando existir), ou `—`.
2. **Diálogo Editar Cobrança (`handleEdit`)** — ao preencher `formData.bank_id`:
   - se `cobranca.bank_id` existir, usar;
   - caso contrário, usar `customer.bank_id` do cliente vinculado (fallback), mantendo o campo editável.
3. **Persistência** — sem mudança: ao salvar a cobrança, o `bank_id` (vindo do fallback ou alterado pelo usuário) é gravado normalmente em `boletos.bank_id`, então cobranças antigas passam a "herdar" o banco do cliente da próxima vez que forem salvas.

Sem mudanças no banco de dados.