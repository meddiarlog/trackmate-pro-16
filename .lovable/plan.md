

## Plano - Melhorias em Ordem de Coleta e Cadastro de Cliente

### 1. Ordem de Coleta - Busca de Motorista

**Status atual**: Ja implementado com Popover+Command buscando por nome, CPF e CNH (linhas 1060-1110 de CollectionOrders.tsx). A busca ja normaliza digitos para CPF/CNH.

**Conclusao**: Nenhuma alteracao necessaria - a funcionalidade ja existe conforme solicitado.

### 2. Ordem de Coleta - Placa (Cavalo e Carreta) com busca digitavel

**Status atual**: Usa `Select` padrao (sem busca por digitacao). O usuario precisa rolar a lista para encontrar a placa.

**Alteracao**: Substituir os `Select` de Cavalo e Carreta(s) por `Popover + Command` (mesmo padrao do motorista), permitindo digitar a placa para filtrar.

| Arquivo | Acao |
|---------|------|
| `src/pages/CollectionOrders.tsx` | Substituir Select por Popover+Command para placa Cavalo e Carreta(s) |

- Adicionar estados `cavaloSearch`/`cavaloPopoverOpen` e equivalentes para carreta
- Filtrar por `license_plate` e `model` (case-insensitive, parcial)
- Manter botao "+" para adicao rapida de veiculo

### 3. Cadastro de Cliente - Secao "Dados de Cobranca"

**Status atual**: O formulario nao possui campos especificos de cobranca. A tabela `customers` nao tem colunas para responsavel de cobranca, contato de cobranca ou email de cobranca.

**Alteracoes**:

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar 3 colunas: `cobranca_responsavel`, `cobranca_contato`, `cobranca_email` na tabela `customers` |
| `src/components/CustomerFormDialog.tsx` | Adicionar secao "Dados de Cobranca" com os 3 campos; incluir no formData, load e save |

**Migracao**:
```sql
ALTER TABLE public.customers
  ADD COLUMN cobranca_responsavel text,
  ADD COLUMN cobranca_contato text,
  ADD COLUMN cobranca_email text;
```

**Formulario**: Nova secao entre "Contatos" e "Prazo do Cliente" com:
- Responsavel (text input)
- Contato (text input, telefone)
- E-mail para Cobranca (text input, type=email)

Atualizar `editingCustomer` interface, `formData`, `useEffect` de load, e `saveCustomerMutation` para incluir os novos campos.

### Resumo de Arquivos

| Arquivo | Tipo |
|---------|------|
| Migracao SQL (customers) | Criar 3 colunas |
| `src/pages/CollectionOrders.tsx` | Placa Cavalo/Carreta com busca digitavel |
| `src/components/CustomerFormDialog.tsx` | Secao "Dados de Cobranca" |

