# Cotação — Múltiplos Destinatários

Replicar em **Cotação** o comportamento de destinatários múltiplos já existente em **Ordem de Coleta**, reaproveitando o mesmo layout (Accordion com botões Adicionar / Remover) e estrutura em lista.

## 1. Banco de Dados

Nova tabela `quote_recipients` (espelho de `collection_order_recipients`):

- `quote_id` (FK lógica para `quotes.id`, ON DELETE CASCADE)
- `position` (ordem do destinatário)
- `name`, `cpf_cnpj`, `phone`, `address`, `city`, `state`, `cep`
- campos padrão (`id`, `created_at`)
- RLS pública (mesmo padrão das demais tabelas do projeto)
- Índice por `quote_id`

Não removeremos `destination_city` / `destination_state` da tabela `quotes` — eles continuarão sendo preenchidos automaticamente com a cidade/UF do **primeiro destinatário** para manter compatibilidade com:
- listagens, filtros e relatórios existentes
- exibição "Origem → Destino" na tabela de cotações
- registros antigos (cotações já criadas)

## 2. Página `src/pages/Quotes.tsx`

- Adicionar `recipients: Array<{ name, cpf_cnpj, phone, address, city, state, cep }>` ao `formData` (inicial com 1 item vazio).
- Substituir o bloco atual do campo **Destino** (cidade/UF únicos) por uma seção **Destinatários** com:
  - botão **Adicionar Destinatário** (`Plus`)
  - `Accordion` com um item por destinatário
  - botão de remover (`Trash2`) desabilitado quando há apenas 1
  - mesmos campos e mesmo visual usados em `CollectionOrders.tsx` (linhas ~1054–1209)
- Validação: pelo menos 1 destinatário com `name` preenchido; se transporte estiver marcado, exigir `city` no primeiro.
- **Salvar (create/update)**: após gravar a cotação, deletar e reinserir as linhas em `quote_recipients` (mesmo padrão de Ordem de Coleta). Atualizar `destination_city/state` com os dados do primeiro destinatário.
- **Editar**: ao abrir uma cotação existente, carregar `quote_recipients` ordenados por `position`. Se não houver nenhuma linha (cotação antiga), criar fallback com 1 destinatário usando `destination_city/state` da própria cotação.
- **Listagem**: a coluna existente continua mostrando `destination_city/UF` (= primeiro destinatário), sem mudança visual.

## 3. Impressão / PDF — `src/components/QuotePrintView.tsx`

- Aceitar `recipients` no tipo `Quote`.
- Substituir a linha única **"Destino: cidade/UF"** por um bloco **DESTINATÁRIOS** listando cada um (nome, CPF/CNPJ, endereço, cidade/UF, CEP, telefone), no mesmo estilo das demais seções.
- Fallback: se `recipients` vier vazio, usar `destination_city/state` (cotações antigas).

## 4. Compatibilidade

- Cotações antigas continuam abrindo (fallback para `destination_city/state`).
- Filtros, ordenações e listagens existentes seguem funcionando.
- Nenhuma alteração em outros módulos.

## Detalhes Técnicos

```text
quotes (existing)
   └── quote_recipients (new, 1:N)
         position, name, cpf_cnpj, phone, address, city, state, cep
```

Padrão de gravação (igual a `collection_order_recipients`):
1. upsert em `quotes`
2. `delete from quote_recipients where quote_id = :id`
3. `insert` em lote das linhas atuais

A primeira migration cria a tabela + RLS. Em seguida, alteramos `Quotes.tsx` e `QuotePrintView.tsx`.
