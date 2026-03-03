

## Plano - Busca de Cliente por CPF/CNPJ/Nome na Cotacao

### Problema
O campo "Cliente" no formulario de Cotacao usa um Select simples que so permite escolher pelo nome. Precisa permitir busca por CPF/CNPJ/Nome.

### Solucao
Substituir o `Select` por um `Popover + Command` com busca, seguindo o mesmo padrao ja implementado no modulo de Cobrancas (`src/pages/Cobrancas.tsx`).

### Alteracoes em `src/pages/Quotes.tsx`

1. **Imports**: Adicionar `Popover`, `PopoverContent`, `PopoverTrigger`, `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `Search`

2. **Estado**: Adicionar `customerPopoverOpen` (boolean) e `customerSearch` (string)

3. **Filtro**: Criar `filteredCustomerOptions` que filtra por nome (case-insensitive) e CPF/CNPJ (apenas digitos)

4. **UI**: Substituir o bloco `Select` (linhas ~668-684) pelo componente Popover+Command que exibe nome e CPF/CNPJ em cada item da lista

O botao "+" para cadastro rapido de cliente sera mantido ao lado.

### Arquivos
| Arquivo | Acao |
|---------|------|
| `src/pages/Quotes.tsx` | Modificar campo Cliente |

Nenhuma alteracao de banco de dados necessaria.

