## Melhorias no Cadastro de Clientes

### 1. Botão "Novo Grupo" no cadastro de cliente
No dialog de cadastro/edição de cliente (`src/pages/Customers.tsx`), ao lado do campo **Grupo**:

- Adicionar botão **`+`** (ícone Plus) próximo ao Select de Grupo.
- Ao clicar, abre um sub-dialog simples com:
  - Input "Nome do Grupo"
  - Botões "Cancelar" e "Salvar"
- Ao salvar: insere em `customer_groups`, invalida a query `["customer_groups"]`, e seleciona automaticamente o novo grupo no campo `group_id` do formulário do cliente.
- Mantém o mesmo padrão visual de "Quick Add" já usado em outros módulos do sistema.

### 2. Mensagem de duplicidade de CNPJ/CPF
Em `src/pages/Customers.tsx` (linha ~238), trocar:

- De: `"Já existe um cliente cadastrado com este CPF/CNPJ."`
- Para: `"Cliente já possui cadastro!"`

### Escopo
- Apenas o módulo **Clientes** (`src/pages/Customers.tsx`).
- Sem alterações em schema do banco — `customer_groups` já existe.
- Sem mudanças no `CustomerFormDialog.tsx` (componente separado, não usado nesta tela).
