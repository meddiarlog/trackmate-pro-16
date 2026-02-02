

## Plano: Tornar Nome Fantasia Opcional

### Resumo
Remover a obrigatoriedade do campo **Nome Fantasia** no cadastro de Clientes. Atualmente o campo está validado como obrigatório em dois arquivos e precisa ser ajustado.

---

## Alteracoes Necessarias

### 1. src/pages/Customers.tsx

**Remover validacao obrigatoria (linhas 304-307):**
```typescript
// REMOVER estas linhas:
if (!formData.nome_fantasia) {
  toast.error("Nome Fantasia é obrigatório");
  return;
}
```

**Atualizar label do campo (linha 419):**
```typescript
// DE:
<Label htmlFor="nome_fantasia">Nome Fantasia *</Label>

// PARA:
<Label htmlFor="nome_fantasia">Nome Fantasia</Label>
```

**Remover atributo required do Input (linha 425):**
```typescript
// DE:
<Input ... required />

// PARA:
<Input ... />
```

---

### 2. src/components/CustomerFormDialog.tsx

**Remover validacao obrigatoria (linhas 273-276):**
```typescript
// REMOVER estas linhas:
if (!formData.nome_fantasia) {
  toast.error("Nome Fantasia é obrigatório");
  return;
}
```

**Atualizar label do campo (linha 321):**
```typescript
// DE:
<Label htmlFor="nome_fantasia">Nome Fantasia *</Label>

// PARA:
<Label htmlFor="nome_fantasia">Nome Fantasia</Label>
```

**Remover atributo required do Input (linha 327):**
```typescript
// DE:
<Input ... required />

// PARA:
<Input ... />
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Customers.tsx` | Remover validacao, asterisco e required |
| `src/components/CustomerFormDialog.tsx` | Remover validacao, asterisco e required |

---

## Resultado Esperado

- O campo **Nome Fantasia** continuara visivel no formulario
- O usuario podera salvar um cliente sem preencher o Nome Fantasia
- Apenas **Razao Social** permanece como campo obrigatorio

