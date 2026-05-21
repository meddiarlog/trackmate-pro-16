## Geração de Faturas — Contas a Receber

### Objetivo
Adicionar emissão de fatura (visualizar / imprimir / salvar em PDF) para cada lançamento de Contas a Receber, com número único no formato `MMYYYY#####` que reinicia a cada mês.

---

### 1. Banco de dados

**Nova coluna em `accounts_receivable`:**
- `invoice_number text` (único quando preenchido) — gravado na 1ª geração e reaproveitado nas reimpressões.

**Nova função SQL `generate_invoice_number()`:**
- Lê o mês/ano atual.
- Busca o maior sequencial entre `invoice_number` que começam com `MMYYYY` no mês corrente.
- Retorna `MM` (2 dígitos) + `YYYY` (4 dígitos) + sequencial (5 dígitos), ex.: `05202600001`.
- Executada via `supabase.rpc('generate_invoice_number')` no momento do clique em "Gerar Fatura".
- Garantia de unicidade: índice único parcial em `invoice_number` + retry em caso de colisão.

Obs.: como solicitado, não criamos tabela separada `invoices` — o lançamento de Contas a Receber **é** a fatura (1:1). O campo `invoice_number` na própria linha já entrega histórico, reimpressão e download a qualquer momento, sem duplicar dados de pagador/valor.

---

### 2. UI — `src/pages/AccountsReceivable.tsx`

**Coluna nova na tabela de lançamentos:** `Nº Fatura` (mostra o número, ou `—`).

**Botão "Gerar Fatura"** no menu de ações de cada linha:
- Se ainda não tem `invoice_number`: chama a RPC, salva o número na linha e abre a visualização.
- Se já tem: abre direto a visualização (reimpressão).

**Filtro:** adicionar busca por `invoice_number` na busca global.

---

### 3. Componente de impressão

**Novo: `src/components/InvoicePrintView.tsx`** (mesmo padrão do `QuotePrintView.tsx`):
- Layout A4, limpo, responsivo, com `@media print`.
- Botões **Imprimir** (`window.print()`) e **Salvar PDF** (usa o "Salvar como PDF" do diálogo de impressão do navegador — mesma abordagem já usada em Quotes/Contracts).

**Conteúdo da fatura:**
- **Cabeçalho — Dados da Empresa** (de `company_settings`): logo (`logo_url`), razão social, nome fantasia, CNPJ, IE, endereço completo, telefone, e-mail.
- **Bloco do Pagador** (de `customers` via `customer_id`): nome/razão social, nome fantasia, CPF/CNPJ, endereço, telefone, e-mail.
- **Bloco Financeiro:**
  - Nº Fatura (`invoice_number`)
  - Data de emissão (data atual da geração, ou `created_at` na reimpressão)
  - Data de vencimento (`due_date`)
  - Forma de pagamento (`payment_method`)
  - Parcela (`installment_number/installments`) quando > 1
  - Descrição: `document_number` + observações
  - Valor, desconto, juros/multa, **Total**
- **Rodapé:** observações + linha de assinatura/empresa.

Formatação pt-BR: `toLocaleString('pt-BR')` para moeda, `dd/MM/yyyy` para datas (com correção de timezone `T00:00:00`, conforme padrão do projeto).

---

### 4. Histórico / Reimpressão

Como o número fica gravado na própria linha de Contas a Receber:
- Lista atual já é o histórico (filtrável por mês/cliente/status).
- "Gerar Fatura" em linha que já tem número = reimpressão / novo download de PDF.

---

### Seção técnica resumida

**Arquivos novos:**
- `src/components/InvoicePrintView.tsx`

**Arquivos alterados:**
- `src/pages/AccountsReceivable.tsx` — coluna `Nº Fatura`, botão "Gerar Fatura", estado do diálogo de impressão, chamada da RPC e update da linha.

**Migration:**
- `ALTER TABLE accounts_receivable ADD COLUMN invoice_number text;`
- `CREATE UNIQUE INDEX ... ON accounts_receivable (invoice_number) WHERE invoice_number IS NOT NULL;`
- `CREATE FUNCTION public.generate_invoice_number() RETURNS text ...` (SECURITY DEFINER, search_path = public).

**Sem mudanças** em outros módulos, em cálculos financeiros existentes ou em RLS.
