

## Plano - Padronizar Busca de Clientes em Todos os Modulos

### Situacao Atual

| Modulo | Tipo de Busca | Campos buscados | Inclui nome_fantasia |
|--------|--------------|-----------------|---------------------|
| Cotacoes (Quotes) | Popover+Command | name, cpf_cnpj | Nao |
| Cobrancas | Popover+Command | name, cpf_cnpj | Nao |
| Contas a Receber (AccountsReceivable) | Select simples | Apenas name | Nao |
| Financeiro (Financial) | Select simples | Apenas name | Nao |

### Solucao

1. **Criar componente reutilizavel `CustomerSearchSelect`** em `src/components/CustomerSearchSelect.tsx`
   - Encapsula o padrao Popover + Command
   - Props: `customers`, `value`, `onChange`, `placeholder?`
   - Busca unificada por: Razao Social (`name`), Nome Fantasia (`nome_fantasia`), CPF/CNPJ (`cpf_cnpj`)
   - Normalizacao de CPF/CNPJ (remove mascara)
   - Busca parcial case-insensitive
   - Exibe nome fantasia (quando diferente) e CPF/CNPJ como subtexto
   - Destaque do termo pesquisado nos resultados (bold/highlight)
   - `shouldFilter={false}` para filtragem customizada

2. **Atualizar queries de customers** para incluir `nome_fantasia` nos modulos que nao buscam esse campo:
   - `Quotes.tsx`: adicionar `nome_fantasia` ao select
   - `Cobrancas.tsx`: adicionar `nome_fantasia` ao select (fetch e join)
   - `AccountsReceivable.tsx`: adicionar `cpf_cnpj, nome_fantasia` ao select
   - `Financial.tsx`: adicionar `cpf_cnpj, nome_fantasia` ao select

3. **Substituir selecao de cliente** nos 4 modulos pelo componente `CustomerSearchSelect`

### Arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/CustomerSearchSelect.tsx` | Criar componente reutilizavel |
| `src/pages/Quotes.tsx` | Substituir Popover inline pelo componente; adicionar nome_fantasia ao query |
| `src/pages/Cobrancas.tsx` | Substituir Popover inline pelo componente; adicionar nome_fantasia ao query |
| `src/pages/AccountsReceivable.tsx` | Substituir Select pelo componente; adicionar cpf_cnpj e nome_fantasia ao query |
| `src/pages/Financial.tsx` | Substituir Select pelo componente; adicionar cpf_cnpj e nome_fantasia ao query |

### Detalhes Tecnicos

**Interface do componente:**
```typescript
interface CustomerOption {
  id: string;
  name: string;
  nome_fantasia?: string | null;
  cpf_cnpj?: string | null;
}

interface CustomerSearchSelectProps {
  customers: CustomerOption[];
  value: string;
  onChange: (customerId: string) => void;
  placeholder?: string;
}
```

**Logica de busca unificada:**
- Normaliza o termo removendo caracteres nao numericos para comparar com CPF/CNPJ
- Busca parcial em: `name`, `nome_fantasia`, `cpf_cnpj` (digitos)
- Ordenacao: resultados que comecam com o termo aparecem primeiro

**Destaque do termo pesquisado:**
- Funcao utilitaria que envolve o trecho correspondente em `<mark>` ou `<strong>`

Nenhuma alteracao de banco de dados necessaria (campo `nome_fantasia` ja existe na tabela `customers`).

