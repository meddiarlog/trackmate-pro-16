

## Plano - Alterar Logo da Tela de Login

Copiar a imagem `LogoTelaLogin.png` para `src/assets/` e atualizar `src/pages/Login.tsx` para usar essa logo no lugar do icone `Truck` atual.

### Alteracoes

| Arquivo | Acao |
|---------|------|
| `src/assets/LogoTelaLogin.png` | Copiar imagem |
| `src/pages/Login.tsx` | Substituir icone Truck pela imagem |

Na tela de login, o bloco com `<Truck>` dentro do circulo azul sera substituido por `<img src={logoTelaLogin} />` com dimensoes adequadas.

