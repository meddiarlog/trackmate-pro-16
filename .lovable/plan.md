## Adicionar campo "Banco para geração de boleto" no cadastro de Clientes

A página `src/pages/Customers.tsx` tem formulário próprio (não usa `CustomerFormDialog`). Vou adicionar o campo `bank_id` diretamente nela.

### Alterações em `src/pages/Customers.tsx`

1. Adicionar `bank_id` em `Customer` interface, no `formData` inicial e no `resetForm`.
2. Adicionar query para buscar bancos ativos da tabela `banks`.
3. Carregar `bank_id` em `handleEdit`.
4. Persistir `bank_id` (com fallback `null`) no `saveCustomerMutation`.
5. Adicionar Select "Banco para geração de boleto" (opcional, com opção "Nenhum") no formulário, próximo ao campo "Prazo do Cliente".

Sem mudanças no banco de dados — coluna `customers.bank_id` já existe.
