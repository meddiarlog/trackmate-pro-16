

## Plano de Implementacao - Melhorias Mutlog v2

---

## Resumo das Alteracoes

Este plano abrange a criacao de um novo modulo **Grupos** e integracao com os modulos **Clientes**, **Cobrancas** e **Relatorios**.

| Modulo | Alteracao | Complexidade |
|--------|-----------|--------------|
| Grupos | Novo menu e CRUD completo | Media |
| Clientes | Campo Grupo (dropdown) | Baixa |
| Cobrancas | Campo Grupo + Observacoes | Baixa |
| Relatorios | Filtro por Grupo | Media |

---

## Detalhamento Tecnico

### 1. Banco de Dados

**Nova tabela `customer_groups`:**

```sql
CREATE TABLE customer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to customer_groups" 
  ON customer_groups FOR ALL USING (true) WITH CHECK (true);
```

**Adicionar coluna `group_id` na tabela `customers`:**

```sql
ALTER TABLE customers 
ADD COLUMN group_id UUID REFERENCES customer_groups(id);
```

**Adicionar colunas na tabela `boletos` (Cobrancas):**

```sql
ALTER TABLE boletos 
ADD COLUMN group_id UUID REFERENCES customer_groups(id),
ADD COLUMN observacoes TEXT;
```

---

### 2. Novo Menu Grupos (Modulo Cadastro)

**Arquivo:** `src/pages/Groups.tsx` (novo)

**Estrutura do CRUD:**

```text
+------------------------------------------+
| Gestao de Grupos                   [+ Novo] |
+------------------------------------------+
| Buscar grupos...                         |
+------------------------------------------+
| ID       | Nome do Grupo  | Acoes        |
| abc123.. | Grupo A        | [Edit] [Del] |
| def456.. | Grupo B        | [Edit] [Del] |
+------------------------------------------+
```

**Regras de negocio:**
- Nome do grupo deve ser unico
- Excluir apenas se nao houver clientes ou cobrancas vinculadas
- Exibir ID parcial (8 caracteres) no card/tabela

**Componentes utilizados:**
- Dialog para cadastro/edicao
- Table para listagem
- Input para busca
- Toast para feedback

---

### 3. Menu Sidebar - Adicionar Grupos

**Arquivo:** `src/components/AppSidebar.tsx`

**Adicionar ao menu Cadastro (linha 35-50):**

```typescript
{
  title: "Cadastro",
  icon: Users,
  items: [
    { title: "Clientes", url: "/customers", icon: Users },
    { title: "Grupos", url: "/groups", icon: FolderOpen }, // NOVO
    {
      title: "Mot. / Veiculo",
      // ... restante
    },
    // ...
  ],
},
```

---

### 4. Rota para Grupos

**Arquivo:** `src/App.tsx`

**Adicionar rota protegida:**

```typescript
import Groups from "./pages/Groups";

// Dentro das rotas protegidas:
<Route path="groups" element={<Groups />} />
```

---

### 5. Campo Grupo no Modulo Clientes

**Arquivo:** `src/pages/Customers.tsx`

**Adicionar no formulario (apos Nome Fantasia):**

```text
+----------------------------------+
| Grupo                            |
|  [Selecione um grupo...     v]  |
+----------------------------------+
```

**Implementacao:**
1. Buscar grupos via useQuery
2. Adicionar Select com grupos
3. Salvar `group_id` junto com cliente
4. Exibir grupo no card do cliente

**Adicionar no formData:**
```typescript
const [formData, setFormData] = useState({
  // ... campos existentes
  group_id: "",  // NOVO
});
```

---

### 6. Campo Grupo e Observacoes no Modulo Cobrancas

**Arquivo:** `src/pages/Cobrancas.tsx`

**6.1 Adicionar no formulario (apos Pagador):**

```text
+----------------------------------+
| Grupo                            |
|  [Selecione um grupo...     v]  |
+----------------------------------+
```

**6.2 Adicionar campo Observacoes (antes do arquivo):**

```text
+----------------------------------+
| Observacoes                      |
|  +------------------------------+|
|  |                              ||
|  | Textarea para tratativas... ||
|  |                              ||
|  +------------------------------+|
+----------------------------------+
```

**Adicionar no formData:**
```typescript
const [formData, setFormData] = useState({
  // ... campos existentes
  group_id: "",      // NOVO
  observacoes: "",   // NOVO
});
```

**Adicionar no Type Cobranca:**
```typescript
type Cobranca = {
  // ... campos existentes
  group_id: string | null;
  observacoes: string | null;
};
```

---

### 7. Filtro por Grupo nos Relatorios

**Arquivo:** `src/pages/Reports.tsx`

**Adicionar filtro de Grupo para tabs:**
- customers
- cobrancas
- accounts-receivable

**Implementacao:**

1. Adicionar estado para grupos:
```typescript
const [groups, setGroups] = useState<{id: string; name: string}[]>([]);
const [groupFilter, setGroupFilter] = useState("all");
```

2. Buscar grupos no carregamento:
```typescript
useEffect(() => {
  const fetchGroups = async () => {
    const { data } = await supabase.from("customer_groups").select("id, name");
    setGroups(data || []);
  };
  fetchGroups();
}, []);
```

3. Adicionar Select de Grupo nos filtros (linha 166-172):
```jsx
{showGroupFilter && (
  <div className="space-y-2">
    <Label>Grupo</Label>
    <Select value={groupFilter} onValueChange={setGroupFilter}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos</SelectItem>
        {groups.map(g => (
          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

4. Aplicar filtro nas queries:
```typescript
// Para customers
if (groupFilter !== "all") {
  query = query.eq("group_id", groupFilter);
}
```

---

## Arquivos a Modificar/Criar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `customer_groups` (tabela) | Criar | Nova tabela de grupos |
| `customers` (tabela) | Alterar | Adicionar `group_id` |
| `boletos` (tabela) | Alterar | Adicionar `group_id` e `observacoes` |
| `src/pages/Groups.tsx` | Criar | Pagina CRUD de grupos |
| `src/App.tsx` | Modificar | Adicionar rota /groups |
| `src/components/AppSidebar.tsx` | Modificar | Adicionar menu Grupos |
| `src/pages/Customers.tsx` | Modificar | Adicionar Select de Grupo |
| `src/pages/Cobrancas.tsx` | Modificar | Adicionar Grupo e Observacoes |
| `src/pages/Reports.tsx` | Modificar | Adicionar filtro por Grupo |

---

## Ordem de Implementacao

1. **Migracoes de banco de dados**
   - Criar tabela `customer_groups`
   - Adicionar `group_id` em `customers`
   - Adicionar `group_id` e `observacoes` em `boletos`

2. **Groups.tsx (nova pagina)**
   - CRUD completo de grupos
   - Validacao de nome unico
   - Verificacao de vinculos antes de excluir

3. **App.tsx e AppSidebar.tsx**
   - Adicionar rota /groups
   - Adicionar menu Grupos no Cadastro

4. **Customers.tsx**
   - Buscar grupos
   - Adicionar Select no formulario
   - Exibir grupo no card

5. **Cobrancas.tsx**
   - Buscar grupos
   - Adicionar Select de Grupo
   - Adicionar Textarea de Observacoes
   - Salvar/editar com novos campos

6. **Reports.tsx**
   - Buscar grupos
   - Adicionar filtro de Grupo
   - Aplicar filtro nas queries

---

## Validacoes e Regras de Negocio

| Funcionalidade | Regra |
|----------------|-------|
| Nome do Grupo | Obrigatorio e unico |
| Exclusao de Grupo | Bloqueada se houver clientes ou cobrancas vinculadas |
| Campo Grupo | Opcional em Clientes e Cobrancas |
| Campo Observacoes | Opcional, texto livre (textarea) |
| Filtro por Grupo | Funciona junto com outros filtros existentes |

---

## Experiencia do Usuario

- Grupos aparecem em dropdown ordenados alfabeticamente
- Ao excluir grupo vinculado, exibir mensagem explicativa
- Campo Observacoes permite textos longos para historico de tratativas
- Filtro de Grupo se integra naturalmente aos filtros existentes
- Padroes visuais consistentes com restante do sistema

---

## Correcao do Erro de Build

O erro de build relacionado ao OpenAI em `@supabase/functions-js` nao esta relacionado ao codigo das edge functions do projeto. Este e um problema de tipagem do pacote `@supabase/functions-js` que referencia uma dependencia que nao esta instalada. Para resolver, sera necessario aguardar uma atualizacao do pacote ou ignorar este erro especifico de tipagem.

