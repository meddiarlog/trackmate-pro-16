

## Plano de Implementacao - Campos Comerciais no Modulo Dados da Empresa

---

## Resumo das Alteracoes

Este plano adiciona informacoes comerciais da empresa e as exibe nos cabecalhos dos documentos gerados.

| Componente | Alteracao | Complexidade |
|------------|-----------|--------------|
| Banco de Dados | Adicionar 3 colunas (vendedor, contato, email) | Baixa |
| Dados da Empresa | Novos campos no formulario | Baixa |
| Ordem de Coleta | Exibir informacoes comerciais no cabecalho | Baixa |
| Proposta Comercial | Exibir informacoes comerciais no cabecalho | Baixa |

---

## Detalhamento Tecnico

### 1. Alteracoes no Banco de Dados

**Tabela:** `company_settings`

**Adicionar novas colunas:**

```sql
ALTER TABLE public.company_settings
ADD COLUMN vendedor TEXT,
ADD COLUMN contato TEXT,
ADD COLUMN email TEXT;
```

| Coluna | Tipo | Nullable | Descricao |
|--------|------|----------|-----------|
| vendedor | TEXT | Sim | Nome do vendedor/comercial responsavel |
| contato | TEXT | Sim | Telefone de contato |
| email | TEXT | Sim | E-mail comercial |

---

### 2. Modulo Dados da Empresa

**Arquivo:** `src/pages/CompanySettings.tsx`

**2.1 Atualizar interface CompanyData (linha 11-24):**

```typescript
interface CompanyData {
  // ... campos existentes
  vendedor: string;
  contato: string;
  email: string;
}
```

**2.2 Atualizar estado inicial (linha 31-43):**

```typescript
const [formData, setFormData] = useState<CompanyData>({
  // ... campos existentes
  vendedor: "",
  contato: "",
  email: "",
});
```

**2.3 Atualizar useEffect (linha 58-75):**

Carregar os novos campos do banco de dados.

**2.4 Adicionar funcao de formatacao de telefone:**

```typescript
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};
```

**2.5 Adicionar nova secao no formulario (apos Endereco):**

```text
+------------------------------------------+
| Informacoes Comerciais                   |
+------------------------------------------+
| Vendedor                                 |
| [Nome do vendedor responsavel       ]    |
+------------------------------------------+
| Contato            | E-mail              |
| [(11) 99999-9999]  | [email@empresa.com] |
+------------------------------------------+
```

**Posicionamento:** Antes do botao "Salvar Dados"

**2.6 Atualizar payload de salvamento (linha 192-204):**

```typescript
const payload = {
  // ... campos existentes
  vendedor: data.vendedor || null,
  contato: data.contato?.replace(/\D/g, "") || null,
  email: data.email || null,
};
```

---

### 3. Cabecalho da Ordem de Coleta

**Arquivo:** `src/components/CollectionOrderPrint.tsx`

**3.1 Atualizar a area do cabecalho da empresa (linhas 60-91):**

Adicionar linha com Vendedor, Contato e E-mail abaixo das informacoes de endereco.

**Estrutura visual proposta:**

```text
+------------------------------------------+
| [LOGO]                                   |
| CNPJ: xx.xxx.xxx/xxxx-xx - I.E.: xxxxx   |
| Rua Exemplo, 123, Bairro                 |
| Cidade-UF CEP 00000-000                  |
| Vendedor: Nome | Tel: (11) 99999-9999    |
| Email: comercial@empresa.com             |
+------------------------------------------+
```

**Codigo (apos linha 88):**

```jsx
{/* Commercial Info */}
{(companySettings?.vendedor || companySettings?.contato || companySettings?.email) && (
  <div className="mt-1">
    {companySettings?.vendedor && (
      <div><span className="font-semibold">Vendedor:</span> {companySettings.vendedor}</div>
    )}
    {companySettings?.contato && (
      <div><span className="font-semibold">Tel:</span> {formatPhone(companySettings.contato)}</div>
    )}
    {companySettings?.email && (
      <div>{companySettings.email}</div>
    )}
  </div>
)}
```

**3.2 Adicionar funcao formatPhone no componente:**

```typescript
const formatPhone = (value: string | null) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  }
  return value;
};
```

---

### 4. Cabecalho da Proposta Comercial

**Arquivo:** `src/components/QuotePrintView.tsx`

**4.1 Atualizar interface CompanySettings (linhas 33-44):**

```typescript
interface CompanySettings {
  // ... campos existentes
  vendedor: string | null;
  contato: string | null;
  email: string | null;
}
```

**4.2 Adicionar funcao formatPhone:**

```typescript
const formatPhone = (value: string | null) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  }
  return value;
};
```

**4.3 Atualizar secao company-details (linhas 103-118):**

Adicionar informacoes comerciais abaixo do endereco.

**Codigo:**

```jsx
{/* Commercial Info */}
{(companySettings?.vendedor || companySettings?.contato || companySettings?.email) && (
  <div className="mt-1">
    {companySettings?.vendedor && (
      <span>Vendedor: {companySettings.vendedor}</span>
    )}
    {companySettings?.contato && (
      <span> | Tel: {formatPhone(companySettings.contato)}</span>
    )}
    {companySettings?.email && (
      <span> | {companySettings.email}</span>
    )}
  </div>
)}
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `company_settings` (tabela) | Adicionar vendedor, contato, email |
| `src/pages/CompanySettings.tsx` | Novos campos no formulario |
| `src/components/CollectionOrderPrint.tsx` | Exibir dados comerciais no cabecalho |
| `src/components/QuotePrintView.tsx` | Exibir dados comerciais no cabecalho |

---

## Ordem de Implementacao

1. **Migracao de banco de dados**
   - Adicionar colunas vendedor, contato e email em company_settings

2. **CompanySettings.tsx**
   - Atualizar interface e estado
   - Adicionar funcao formatPhone
   - Adicionar secao "Informacoes Comerciais" no formulario
   - Atualizar carregamento e salvamento

3. **CollectionOrderPrint.tsx**
   - Adicionar funcao formatPhone
   - Exibir dados comerciais no cabecalho

4. **QuotePrintView.tsx**
   - Atualizar interface CompanySettings
   - Adicionar funcao formatPhone
   - Exibir dados comerciais no cabecalho

---

## Validacoes e Comportamento

| Campo | Validacao | Comportamento |
|-------|-----------|---------------|
| Vendedor | Opcional, texto livre | Nao exibir se vazio |
| Contato | Opcional, formatacao telefone | Armazenar apenas digitos, formatar na exibicao |
| E-mail | Opcional, texto | Nao exibir se vazio |

**Regras de exibicao nos documentos:**
- Se nenhum campo comercial estiver preenchido, a secao nao aparece
- Cada campo e exibido apenas se possuir valor
- Layout se adapta aos campos disponiveis
- Nao quebra geracao de documentos com campos vazios

---

## Fluxo Visual nos Documentos

**Ordem de Coleta (cabecalho compacto):**

```text
+------------------------------------------+
| [LOGO]                                   |
| CNPJ: 00.000.000/0000-00 - I.E.: 123456  |
| Rua Exemplo, 123, Centro                 |
| Sao Paulo-SP CEP 01234-567               |
| Vendedor: Joao Silva                     |
| Tel: (11) 98765-4321 | email@empresa.com |
+------------------------------------------+
```

**Proposta Comercial (cabecalho horizontal):**

```text
+----------------------------------------------------------+
| [LOGO]  | EMPRESA LTDA                                   |
|         | CNPJ: 00.000.000/0000-00                        |
|         | IE: 123456789                                   |
|         | Rua Exemplo, 123, Centro - Sao Paulo/SP         |
|         | Vendedor: Joao | Tel: (11) 98765-4321 | email@x |
+----------------------------------------------------------+
```

---

## Consideracoes Finais

- Todos os campos sao opcionais, nao afetando registros existentes
- Formatacao de telefone suporta fixo (10 digitos) e celular (11 digitos)
- Layout responsivo mantido no formulario de configuracao
- Documentos PDF existentes nao serao afetados ate atualizacao dos dados

