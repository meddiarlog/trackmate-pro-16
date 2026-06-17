## Simplificar Origens e Destinatários no módulo Cotação

Reduzir os blocos de origem e destinatário no módulo **Cotação** para conter apenas **Cidade** e **UF**, permitindo múltiplos itens em cada bloco.

### Mudanças

**1. Banco de dados (migration)**
- Criar tabela `quote_origins` (id, quote_id FK, city, state, position, created_at) com RLS + GRANTs equivalentes a `quote_recipients`.
- Manter `quote_recipients` mas usar apenas `city` e `state` no app (demais colunas ficam no banco para compatibilidade com cotações antigas; não removo colunas para não quebrar histórico).
- Manter `origin_city/origin_state` e `destination_city/destination_state` em `quotes` apenas como espelho do primeiro item (legado / relatórios).

**2. `src/pages/Quotes.tsx`**
- `formData`: substituir `origin_city/origin_state` por `origins: [{ city, state }]` e reduzir `recipients` para `[{ city, state }]`.
- UI: dois Accordions lado a lado (ou empilhados) — **Origens** e **Destinatários** — com botões "Adicionar Origem" / "Adicionar Destinatário" e remover por item. Manter padrão visual do Accordion atual.
- Remover da tela os campos: nome, CPF/CNPJ, telefone, endereço, CEP do destinatário (e quaisquer campos extras de origem que existirem).
- Validação no submit: cada origem e cada destinatário deve ter `city` e `state` preenchidos; pelo menos 1 de cada.
- Save: sincronizar `quote_origins` e `quote_recipients` por delete+insert (mesmo padrão atual). Gravar primeiro item também em `origin_city/origin_state` e `destination_city/destination_state` para compatibilidade.
- Edit/View: carregar `quote_origins` e `quote_recipients`. Fallback para legado: se não houver linhas, usar `origin_city/origin_state` e `destination_city/destination_state` da própria cotação.

**3. `src/components/QuotePrintView.tsx`**
- Substituir seção "DADOS DO SERVIÇO > Origem" por seção **ORIGEM/ORIGENS** listando todas as origens (Cidade/UF).
- Seção **DESTINATÁRIO(S)** já existente: simplificar para listar apenas Cidade/UF (remover linhas de nome, CNPJ, endereço, CEP, telefone).
- Fallback legado: usar `origin_city/state` e `destination_city/state` quando não houver listas.

### Regras
- Sem mudanças nos demais módulos (Ordem de Coleta permanece com destinatário completo).
- Não removo colunas existentes — apenas paro de usá-las no formulário.
- Sem alterações em máscaras/formatadores.
