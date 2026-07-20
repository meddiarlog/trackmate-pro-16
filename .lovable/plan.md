## Remover boleto anexado na edição de Contas a Pagar

### O que muda
No dialog de edição de uma conta em **Contas a Pagar**, quando já existir um boleto anexado, adicionar um botão para **remover o boleto** (útil quando foi anexado errado).

### Comportamento
- Ao lado do botão de "Visualizar boleto" (ícone olho), incluir um botão de "Remover boleto" (ícone lixeira, em vermelho).
- Ao clicar, pedir confirmação ("Deseja realmente remover o boleto anexado?").
- Confirmado:
  - Apagar o arquivo do storage bucket `boletos`.
  - Atualizar o registro em `accounts_payable` zerando `boleto_file_url` e `boleto_file_name`.
  - Limpar os estados locais (`existingBoletoUrl`, `existingBoletoName`, `boletoFile`) para o input voltar ao estado vazio.
  - Exibir toast de sucesso e recarregar a lista.

### Arquivo alterado
- `src/pages/AccountsPayable.tsx` — bloco do upload de boleto (linhas ~650–694) e adição de uma pequena função `handleRemoveBoleto`.

### Não muda
- Estrutura do banco, storage, ou outras telas.
- Lógica de upload/edição existente.
