
## Plano de Implementacao - Melhorias Mutlog

---

## Resumo das Alteracoes

Este plano abrange melhorias nos modulos **Clientes** e **Cotacao** para otimizar a experiencia do usuario e adicionar funcionalidades de cadastro rapido.

| Modulo | Alteracao | Complexidade |
|--------|-----------|--------------|
| Clientes | Mover "Responsavel" para bloco de Contato | Baixa |
| Clientes | Adicionar campo "Nome Fantasia" | Media |
| Clientes | Exibir contatos nos cards de clientes | Media |
| Cotacao | Botao "+" para cadastro rapido de Produto | Media |
| Cotacao | Botao "+" para cadastro rapido de Tipo de Veiculo | Media |
| Cotacao | Botao "+" para cadastro rapido de Tipo de Carroceria | Media |

---

## Detalhamento Tecnico

### 1. Banco de Dados

**Adicionar coluna `nome_fantasia` na tabela `customers`:**

```sql
ALTER TABLE customers 
ADD COLUMN nome_fantasia TEXT;
```

---

### 2. Modulo Clientes - Alteracoes no Formulario

**Arquivo:** `src/pages/Customers.tsx` e `src/components/CustomerFormDialog.tsx`

**2.1 Campo Nome Fantasia (novo campo obrigatorio)**

Adicionar abaixo do campo "Razao Social":

```text
+----------------------------------+
| Razao Social *                   |
|  [____________________________] |
+----------------------------------+
| Nome Fantasia *                  |
|  [____________________________] |
+----------------------------------+
```

**2.2 Mover Responsavel para dentro do bloco de Contatos**

Estrutura atual do contato:
- Tipo de Contato
- Telefone
- E-mail

Nova estrutura (Responsavel dentro de cada contato):
```text
+----------------------------------------+
| Contato 1                    [Lixeira] |
+----------------------------------------+
| Responsavel                            |
|  [______________________________]      |
+----------------------------------------+
| Tipo de Contato | Telefone | E-mail    |
| [Comercial  v]  | [______] | [______]  |
+----------------------------------------+
```

**Modificacoes necessarias:**

1. Atualizar interface `Contact` em `CustomerContactList.tsx`:
```typescript
interface Contact {
  id?: string;
  tipo: "financeiro" | "comercial";
  telefone: string;
  email: string;
  responsavel: string;  // NOVO CAMPO
}
```

2. Atualizar tabela `customer_contacts` (migracao SQL):
```sql
ALTER TABLE customer_contacts 
ADD COLUMN responsavel TEXT;
```

3. Remover campo "Responsavel" de fora do bloco de contatos

---

### 3. Modulo Clientes - Cards de Exibicao

**Arquivo:** `src/pages/Customers.tsx`

**Dados a exibir nos cards:**

```text
+----------------------------------------+
| Razao Social                           |
| Nome Fantasia                          |
| CNPJ: XX.XXX.XXX/XXXX-XX               |
+----------------------------------------+
| Contatos:                              |
|  - Joao (Comercial): (11) 99999-9999   |
|  - Maria (Financeiro): (11) 88888-8888 |
+----------------------------------------+
| Prazo: 30 dias                         |
+----------------------------------------+
| [Editar]              [Remover]        |
+----------------------------------------+
```

**Implementacao:**
- Criar query para buscar `customer_contacts` junto com cada cliente
- Exibir lista de contatos no card com responsavel, tipo e telefone

---

### 4. Modulo Cotacao - Cadastro Rapido de Produto

**Arquivo:** `src/pages/Quotes.tsx`

**Padrao a seguir:** Mesmo padrao usado para Customer (CustomerFormDialog)

**Implementacao:**

1. Adicionar estado para controle do dialog:
```typescript
const [productDialogOpen, setProductDialogOpen] = useState(false);
const [newProductName, setNewProductName] = useState("");
```

2. Adicionar mutation para criar produto:
```typescript
const addProductMutation = useMutation({
  mutationFn: async (name: string) => {
    const { data, error } = await supabase
      .from("products")
      .insert({ name })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    setFormData(prev => ({ ...prev, product_id: data.id }));
    setNewProductName("");
    setProductDialogOpen(false);
    toast.success("Produto cadastrado!");
  },
});
```

3. Adicionar botao "+" ao lado do Select de Produto:
```jsx
<div className="flex items-center gap-2">
  <div className="flex-1">
    <Select ...>
      ...
    </Select>
  </div>
  <Button 
    variant="outline" 
    size="icon" 
    className="mt-6"
    onClick={() => setProductDialogOpen(true)}
  >
    <Plus className="h-4 w-4" />
  </Button>
</div>
```

4. Adicionar Dialog para novo produto:
```jsx
<Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Cadastrar Novo Produto</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <Input 
        value={newProductName}
        onChange={(e) => setNewProductName(e.target.value)}
        placeholder="Nome do produto"
      />
      <Button onClick={() => addProductMutation.mutate(newProductName)}>
        Cadastrar
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

### 5. Modulo Cotacao - Cadastro Rapido de Tipo de Veiculo

**Arquivo:** `src/pages/Quotes.tsx`

**Implementacao identica ao padrao de Produto:**

1. Estado: `vehicleTypeDialogOpen`, `newVehicleTypeName`
2. Mutation: insercao em `vehicle_types`
3. Botao "+" ao lado do Select
4. Dialog simples com input de nome

---

### 6. Modulo Cotacao - Cadastro Rapido de Tipo de Carroceria

**Arquivo:** `src/pages/Quotes.tsx`

**Implementacao identica ao padrao de Produto:**

1. Estado: `bodyTypeDialogOpen`, `newBodyTypeName`
2. Mutation: insercao em `body_types`
3. Botao "+" ao lado do Select
4. Dialog simples com input de nome

---

## Arquivos a Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `customer_contacts` (tabela) | Migracao | Adicionar coluna `responsavel` |
| `customers` (tabela) | Migracao | Adicionar coluna `nome_fantasia` |
| `src/components/CustomerContactList.tsx` | Modificar | Adicionar campo Responsavel no bloco |
| `src/components/CustomerFormDialog.tsx` | Modificar | Adicionar Nome Fantasia, remover Responsavel externo |
| `src/pages/Customers.tsx` | Modificar | Atualizar form, cards com contatos e nome fantasia |
| `src/pages/Quotes.tsx` | Modificar | Adicionar quick-add para Produto, Tipo Veiculo, Carroceria |

---

## Ordem de Implementacao

1. **Migracoes de banco de dados**
   - Adicionar `nome_fantasia` em `customers`
   - Adicionar `responsavel` em `customer_contacts`

2. **CustomerContactList.tsx**
   - Atualizar interface Contact
   - Adicionar campo Responsavel no formulario de contato

3. **CustomerFormDialog.tsx e Customers.tsx**
   - Adicionar campo Nome Fantasia
   - Remover campo Responsavel externo
   - Atualizar logica de salvamento

4. **Customers.tsx - Cards**
   - Buscar contatos junto com clientes
   - Exibir Nome Fantasia e Contatos nos cards

5. **Quotes.tsx**
   - Adicionar quick-add para Produto
   - Adicionar quick-add para Tipo de Veiculo
   - Adicionar quick-add para Tipo de Carroceria

---

## Validacoes

| Campo | Validacao |
|-------|-----------|
| Razao Social | Obrigatorio |
| Nome Fantasia | Obrigatorio |
| CNPJ/CPF | Anti-duplicidade (ja existe) |

---

## Experiencia do Usuario

- Todos os cadastros rapidos selecionam automaticamente o item recem-criado
- Dialogs simples e focados para minimizar friccao
- Padroes visuais consistentes com o restante do sistema
- Nenhuma necessidade de navegar para outra pagina para cadastrar itens auxiliares
