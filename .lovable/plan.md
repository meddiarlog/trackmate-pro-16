

## Plano de Implementacao - Formas de Pagamento

---

## Resumo

Criar um cadastro de Formas de Pagamento em Configuracoes > Banco, e integrar como dropdown dinamico nos modulos financeiros e operacionais.

| Componente | Alteracao | Complexidade |
|------------|-----------|--------------|
| Banco de dados: tabela payment_methods | Baixa |
| Menu lateral: submenu Banco | Baixa |
| Pagina PaymentMethods (CRUD) | Media |
| Rota no App.tsx | Baixa |
| Integracao nos 5 modulos | Media |

---

## 1. Banco de Dados

**Nova tabela:** `payment_methods`

```sql
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payment_methods" ON public.payment_methods FOR SELECT USING (true);
CREATE POLICY "Anyone can insert payment_methods" ON public.payment_methods FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payment_methods" ON public.payment_methods FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete payment_methods" ON public.payment_methods FOR DELETE USING (true);

-- Seed com formas de pagamento existentes no sistema
INSERT INTO public.payment_methods (name) VALUES
  ('Boleto'),
  ('Pix'),
  ('Transferência'),
  ('Depósito'),
  ('80% + SALDO'),
  ('Saldo'),
  ('A Combinar');
```

---

## 2. Menu Lateral

**Arquivo:** `src/components/AppSidebar.tsx`

Dentro do grupo "Configuracoes", apos "Unidades", adicionar submenu "Banco" com item "Forma de Pagamento":

```text
Configuracoes
  ├── Dados da Empresa
  ├── Unidades
  └── Banco
      └── Forma de Pagamento
```

O item "Banco" tera icone `Wallet` e a rota sera `/settings/payment-methods`.

---

## 3. Pagina CRUD - Forma de Pagamento

**Novo arquivo:** `src/pages/PaymentMethods.tsx`

Seguira o padrao existente (similar a BodyTypes.tsx):

- Listagem com busca por nome
- Dialog para criar/editar com campos: Nome e Status (Ativo/Inativo)
- Menu de acoes (hamburger) com Editar e Excluir
- Badge de status (verde para Ativo, cinza para Inativo)
- Validacao de duplicidade por nome
- **Validacao de exclusao**: antes de excluir, verificar se a forma de pagamento esta em uso nas tabelas `accounts_payable`, `accounts_receivable`, `collection_orders`, `quotes`. Se estiver vinculada, exibir mensagem impedindo a exclusao.

```text
+------------------------------------------+
| Formas de Pagamento          [+ Incluir] |
+------------------------------------------+
| [Buscar...]                              |
+------------------------------------------+
| Nome           | Status    | Acoes       |
|----------------|-----------|-------------|
| Boleto         | Ativo     | [...]       |
| Pix            | Ativo     | [...]       |
| Transferencia  | Inativo   | [...]       |
+------------------------------------------+
```

---

## 4. Rota no App.tsx

**Arquivo:** `src/App.tsx`

Adicionar:
- Import do componente PaymentMethods
- Rota `settings/payment-methods`

---

## 5. Integracao nos Modulos

Em cada modulo, substituir as opcoes hardcoded do Select de "Forma de Pagamento" por uma query dinamica a tabela `payment_methods` (filtrando `is_active = true`).

### 5.1 Contas a Pagar (`src/pages/AccountsPayable.tsx`)

- Adicionar query: `useQuery` para buscar `payment_methods` ativos
- Substituir SelectItems hardcoded (Boleto, Pix) por items dinamicos
- Manter valor do `payment_method` como texto (nome da forma de pagamento)

### 5.2 Contas a Receber (`src/pages/AccountsReceivable.tsx`)

- Mesmo padrao do Contas a Pagar

### 5.3 Cobrancas (`src/pages/Cobrancas.tsx`)

- Este modulo nao possui campo payment_method atualmente
- **Nao sera alterado** pois nao ha campo de forma de pagamento no formulario de cobrancas

### 5.4 Ordem de Coleta (`src/pages/CollectionOrders.tsx`)

- Substituir o array `PAYMENT_METHODS` hardcoded (linha 27) por query dinamica
- Atualizar o Select correspondente

### 5.5 Cotacao (`src/pages/Quotes.tsx`)

- Substituir SelectItems hardcoded (PIX, Boleto, Transferencia, etc.) por items dinamicos

---

## 6. Padrao da Query Reutilizavel

Em cada modulo, a query seguira este padrao:

```typescript
const { data: paymentMethods = [] } = useQuery({
  queryKey: ["payment-methods-active"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return data;
  },
});
```

E o Select sera renderizado como:

```jsx
<Select value={form.payment_method} onValueChange={...}>
  <SelectTrigger>
    <SelectValue placeholder="Selecione" />
  </SelectTrigger>
  <SelectContent>
    {paymentMethods.map((pm) => (
      <SelectItem key={pm.id} value={pm.name}>
        {pm.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Nota:** O valor armazenado sera o **nome** da forma de pagamento (texto), mantendo compatibilidade com dados existentes.

---

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| `payment_methods` (tabela) | Criar |
| `src/pages/PaymentMethods.tsx` | Criar |
| `src/components/AppSidebar.tsx` | Modificar (adicionar submenu Banco) |
| `src/App.tsx` | Modificar (adicionar rota) |
| `src/pages/AccountsPayable.tsx` | Modificar (query dinamica) |
| `src/pages/AccountsReceivable.tsx` | Modificar (query dinamica) |
| `src/pages/CollectionOrders.tsx` | Modificar (query dinamica) |
| `src/pages/Quotes.tsx` | Modificar (query dinamica) |

---

## Validacoes

| Regra | Descricao |
|-------|-----------|
| Nome unico | Nao permitir formas de pagamento com nome duplicado |
| Exclusao segura | Impedir exclusao se vinculada a registros existentes |
| Status ativo | Apenas formas ativas aparecem nos dropdowns |
| Compatibilidade | Registros existentes com valores hardcoded continuam funcionando |

---

## Ordem de Implementacao

1. Migracao de banco de dados (criar tabela + seed)
2. Criar pagina PaymentMethods.tsx
3. Adicionar rota no App.tsx
4. Atualizar menu lateral (AppSidebar.tsx)
5. Integrar nos modulos (AccountsPayable, AccountsReceivable, CollectionOrders, Quotes)

