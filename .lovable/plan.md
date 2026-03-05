

## Plano - Corrigir Logo da Tela de Login

O codigo em `Login.tsx` ja esta correto (importa e exibe `LogoTelaLogin.png`), porem o arquivo `src/assets/LogoTelaLogin.png` aparentemente nao foi substituido corretamente na ultima edicao — o diff mostra que o arquivo binario foi alterado mas a imagem antiga (icone do caminhao no circulo azul) continua aparecendo.

### Solucao

Recopiar o arquivo `LogoTelaLogin.png` fornecido pelo usuario para `src/assets/LogoTelaLogin.png`, garantindo que o binario correto seja gravado. O codigo em `Login.tsx` nao precisa de alteracao pois ja referencia esse arquivo.

### Alteracoes

| Arquivo | Acao |
|---------|------|
| `src/assets/LogoTelaLogin.png` | Recopiar a imagem correta do upload do usuario |

Nenhuma outra alteracao necessaria.

