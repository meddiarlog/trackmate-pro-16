## Exibir o banco vinculado nas Cobranças

Hoje a página **Cobranças** já salva o `bank_id` em cada cobrança (preenchido automaticamente a partir do cliente, mas editável). No entanto, a tabela de cobranças ativas não mostra essa informação. Vou adicionar uma coluna **Banco** na listagem.

### Alterações em `src/pages/Cobrancas.tsx`

1. **Linha computada por cobrança** (`transformedCobrancas`): adicionar `bankName` resolvido a partir de `bank_id` usando o estado `banks` já carregado. Formato exibido: `"001 - Banco do Brasil"` quando houver código, ou apenas o nome.
2. **Coluna "Banco"** em `columns` da `FilterableTable`, posicionada logo após a coluna **Tipo** (faz sentido junto das informações de cobrança). Renderiza `bankName` ou `—`. Marcar como `sortable: true`.
3. **Filtro global**: incluir `'bankName'` na lista de campos pesquisáveis passada para `useTableFilters`, para permitir busca pelo nome do banco.

Sem mudanças no banco de dados — `boletos.bank_id` e `banks` já existem e já são carregados.

### Resultado esperado

- Cada linha da tabela de cobranças mostra o banco que será usado para gerar o boleto.
- O valor segue o `bank_id` salvo na própria cobrança (que por padrão veio do cadastro do cliente, mas pode ter sido alterado manualmente no momento da cobrança).
- A coluna é ordenável e participa da busca global.