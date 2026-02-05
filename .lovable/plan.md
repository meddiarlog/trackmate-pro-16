

## Plano de Implementacao - Melhorias Modulo Controle de Credito

---

## Resumo das Alteracoes

Este plano implementa melhorias de UX e padronizacao no modulo de Controle de Credito.

| Melhoria | Descricao | Complexidade |
|----------|-----------|--------------|
| Cabecalho fixo | Manter totais e botao visiveis durante rolagem | Baixa |
| Ordenacao por credito | Filtro de ordenacao crescente/decrescente | Baixa |
| Formatacao monetaria | Valores com 2 casas decimais no formato brasileiro | Baixa |

---

## Detalhamento Tecnico

### 1. Cabecalho Fixo (Sticky Header)

**Arquivo:** `src/pages/CreditControl.tsx`

**Alteracao estrutural no layout principal:**

```text
ANTES:
+--------------------------------------+
| Controle de Crédito    [Novo Registro]| <- Header
+--------------------------------------+
| [Card Selecionados] [Card Total Geral]| <- Summary Cards
+--------------------------------------+
| Filtros e Tabela de Registros        | <- Conteudo (tudo rola junto)
+--------------------------------------+

DEPOIS:
+--------------------------------------+ \
| Controle de Crédito    [Novo Registro]|  |
+--------------------------------------+  | STICKY (fixo no topo)
| [Card Selecionados] [Card Total Geral]|  |
+--------------------------------------+ /
| Filtros e Tabela de Registros        | <- Conteudo (apenas isso rola)
+--------------------------------------+
```

**Implementacao:**
- Dividir o conteudo em duas secoes: cabecalho fixo e conteudo rolavel
- Utilizar CSS `sticky` com `top-0` e `z-index` adequado
- Adicionar `bg-background` para evitar sobreposicao visual
- Garantir responsividade mobile

**Codigo principal (linha 756-1014):**

```typescript
<div className="p-6 flex flex-col h-[calc(100vh-4rem)]">
  {/* STICKY HEADER - Titulo + Cards */}
  <div className="sticky top-0 z-10 bg-background pb-4 space-y-4">
    <div className="flex justify-between items-center">
      <h1>Controle de Crédito</h1>
      <Button>Novo Registro</Button>
    </div>
    
    {/* Summary Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card Selecionados + Card Total Geral */}
    </div>
  </div>

  {/* SCROLLABLE CONTENT - Tabela */}
  <div className="flex-1 overflow-y-auto">
    <Card>
      <CardContent>
        <FilterableTable ... />
      </CardContent>
    </Card>
  </div>
</div>
```

---

### 2. Ordenacao por Valor de Credito

**Arquivo:** `src/pages/CreditControl.tsx`

**Adicionar filtro de ordenacao dedicado para credito:**

A coluna "Crédito" ja possui `sortable: true` (linha 716-722), porem vamos adicionar um dropdown explicito para ordenacao rapida.

**Adicionar Select de ordenacao no cabecalho fixo:**

```text
+------------------------------------------+
| Controle de Crédito                      |
|                                          |
| Ordenar Crédito: [Crescente v] [+ Novo]  |
+------------------------------------------+
```

**Codigo:**

```typescript
// Novo estado para ordenacao rapida de credito
const [creditoSort, setCreditoSort] = useState<'none' | 'asc' | 'desc'>('none');

// Aplicar ordenacao apos filtros
const sortedFilteredData = useMemo(() => {
  if (creditoSort === 'none') return filteredData;
  return [...filteredData].sort((a, b) => {
    return creditoSort === 'asc' 
      ? a.credito - b.credito 
      : b.credito - a.credito;
  });
}, [filteredData, creditoSort]);

// Componente Select
<Select value={creditoSort} onValueChange={setCreditoSort}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Ordenar Crédito" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">Sem ordenação</SelectItem>
    <SelectItem value="asc">Crédito: Crescente</SelectItem>
    <SelectItem value="desc">Crédito: Decrescente</SelectItem>
  </SelectContent>
</Select>
```

---

### 3. Padronizacao de Valores Monetarios (2 Casas Decimais)

**Arquivo:** `src/pages/CreditControl.tsx`

Os valores ja utilizam `toLocaleString('pt-BR', { minimumFractionDigits: 2 })`, mas precisamos garantir:

1. **Arredondamento correto** (nao truncar)
2. **Aplicacao em todos os pontos**

**Locais a verificar/ajustar:**

| Local | Linha | Status Atual | Ajuste |
|-------|-------|--------------|--------|
| transformedRecords.formattedCredito | 340 | Correto | Manter |
| selectedCredito (card) | 985 | Correto | Manter |
| totalCredito (card) | 1007 | Correto | Manter |
| calculatedCredito (form) | 909 | Correto | Manter |
| UtilizarCreditoDialog | 84, 115 | Correto | Manter |

**Garantir arredondamento na funcao calculateCredito:**

```typescript
// ANTES (linha 386-388):
const calculateCredito = (quantidade: number) => {
  return (quantidade * 112) / 100;
};

// DEPOIS (com arredondamento para 2 casas):
const calculateCredito = (quantidade: number) => {
  return Math.round(((quantidade * 112) / 100) * 100) / 100;
};
```

Este padrao `Math.round((value) * 100) / 100` ja e utilizado nos modulos financeiros conforme memoria do sistema.

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/CreditControl.tsx` | Layout sticky, Select ordenacao, arredondamento |

---

## Fluxo Visual Apos Implementacao

```text
+------------------------------------------------+
|  CABECALHO FIXO (sticky)                       |
+------------------------------------------------+
| Controle de Crédito                            |
|                                                |
| Ordenar Crédito: [Decrescente v]  [+ Novo]     |
+------------------------------------------------+
| [Selecionados: 3] [Total: 15.847,62]           |
| [registros: 3]    [registros: 127]             |
+------------------------------------------------+

+------------------------------------------------+
|  CONTEUDO ROLAVEL                              |
+------------------------------------------------+
| [Buscar...] [De] [Até]                         |
+------------------------------------------------+
| NFe | Chave | CNPJ | ... | Crédito  | Ações   |
+------------------------------------------------+
| 001 | ...   | ...  | ... | 147,62   | [E] [X] |
| 002 | ...   | ...  | ... | 1.234,50 | [E] [X] |
| ... (rola independente)                        |
+------------------------------------------------+
```

---

## Compatibilidade Mobile

- O cabecalho sticky tera altura adaptativa
- Os cards de totais empilharao verticalmente em telas pequenas
- O Select de ordenacao ficara abaixo do titulo em mobile
- A tabela mantera scroll horizontal existente

---

## Checklist Final

- Cabecalho fixo com titulo, botao e totais
- Select de ordenacao por credito (Crescente/Decrescente)
- Valores formatados com 2 casas decimais (formato brasileiro)
- Arredondamento matematico correto
- Layout responsivo mantido
- Sem impacto em outros modulos

