## Problema Identificado
A validação de CNPJ duplicado já existe no código (linha 240) e lança a mensagem **"Cliente já possui cadastro!"**, porém o handler `onError` da mutation (linha 298-301) não exibe essa mensagem ao usuário — mostra apenas um texto genérico fixo **"Erro ao salvar cliente"**.

## Correção Proposta
Ajustar o handler `onError` em `src/pages/Customers.tsx` para exibir a mensagem específica do erro lançado:

- Se o erro contiver a mensagem "Cliente já possui cadastro!", exibir essa mensagem no `toast.error()`.
- Caso contrário, manter ou melhorar a mensagem genérica.

## Arquivo Alvo
- `src/pages/Customers.tsx` — linhas 298-301 (handler `onError` da `saveCustomerMutation`)

## Não Será Alterado
- A lógica de validação de duplicidade (já está correta).
- Qualquer outra funcionalidade do módulo de clientes.

---

**Resumo técnico:** O `toast.error()` atual recebe string fixa. Deve ser alterado para extrair `error.message` e mostrá-la ao usuário.