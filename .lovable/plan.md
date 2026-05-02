# Buscar Destinatário em Clientes (Ordem de Coleta)

Atualmente cada destinatário no formulário de Ordem de Coleta é digitado manualmente em campos livres (Nome, CPF/CNPJ, Telefone, Endereço, Cidade, UF, CEP). Vamos adicionar uma busca em **Clientes** que permite localizar pelo **Nome, Nome Fantasia, CPF ou CNPJ** e auto-preencher todos os campos do destinatário.

## Padrão a reutilizar

O projeto já tem o componente `CustomerSearchSelect` (`src/components/CustomerSearchSelect.tsx`) usado em outras telas — combobox com Popover + Command que filtra por nome/fantasia/CPF/CNPJ e destaca o trecho buscado. Vamos reaproveitar exatamente esse componente para manter consistência visual.

## Mudanças

### `src/pages/CollectionOrders.tsx`

1. **Carregar clientes** (caso ainda não esteja carregado no escopo do formulário): adicionar um `useQuery` para `customers` selecionando `id, name, nome_fantasia, cpf_cnpj, phone, address, neighborhood, city, state, cep`. Se já existir uma query equivalente (usada em outro select de cliente da página), reutilizá-la.

2. **No bloco de cada destinatário do Accordion** (linhas ~1124–1136, antes do campo "Nome / Razão Social"), inserir uma nova linha "Buscar em Clientes":
   ```
   [ CustomerSearchSelect ... ]   (largura md:col-span-2)
   ```
   - Placeholder: `Buscar cliente por nome, CPF ou CNPJ...`
   - `value`: novo campo opcional `rec.customer_id` (não persistido no banco — apenas controle de UI; ou simplesmente sem value, sempre como busca disparadora).
   - `onChange(customerId)`: localiza o cliente na lista e faz merge no destinatário daquele índice:
     ```ts
     setFormData(prev => {
       const recipients = [...(prev.recipients || [])];
       const c = customers.find(x => x.id === customerId);
       if (c) {
         const fullAddress = [c.address, c.neighborhood].filter(Boolean).join(", ");
         recipients[idx] = {
           ...recipients[idx],
           name: c.nome_fantasia || c.name,
           cpf_cnpj: c.cpf_cnpj || "",
           phone: c.phone || "",
           address: fullAddress,
           city: c.city || "",
           state: c.state || "",
           cep: c.cep || "",
         };
       }
       return { ...prev, recipients };
     });
     ```
   - Os campos manuais permanecem editáveis após o auto-preenchimento (o usuário pode ajustar).

3. **Comportamento**: a busca não é obrigatória — o usuário ainda pode digitar manualmente os dados do destinatário (mantém compatibilidade com cenários onde o destinatário não está cadastrado em Clientes).

### Sem mudanças em banco

Nenhuma migração necessária. O destinatário continua salvo em `collection_order_recipients` com os mesmos campos. A busca é apenas conveniência de UI para preencher os campos.

### Sem mudanças em impressão

A impressão (`CollectionOrderPrint.tsx`) já lê os dados do destinatário; como os mesmos campos continuam sendo gravados, nada precisa mudar lá.

## Resumo de arquivos afetados

- `src/pages/CollectionOrders.tsx` — adicionar query de customers (se faltar) e o `CustomerSearchSelect` no topo de cada item do accordion de destinatários, com handler de auto-preenchimento.
