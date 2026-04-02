

## Plano - Corrigir Busca de Motorista por Nome

### Problema Identificado

O componente `CommandItem` do cmdk v1 nao possui a prop `value` explicita. O cmdk deriva o valor do conteudo textual do item (ex: `"JOSE LUCIANO DE ARAUJOCPF: 05978761426 | CNH: 035023750026"`). Mesmo com `shouldFilter={false}`, o cmdk v1 pode interferir na visibilidade dos itens quando o input controlado nao corresponde ao valor derivado.

### Solucao

No arquivo `src/pages/CollectionOrders.tsx`, adicionar a prop `value` explicita em cada `CommandItem` do motorista, usando uma combinacao unica (ex: `d.id`) para evitar conflitos com a logica interna do cmdk:

```typescript
<CommandItem 
  key={d.id} 
  value={d.id}  // <-- adicionar valor explicito
  onSelect={() => { ... }}
>
```

Isso garante que o cmdk nao tente fazer matching interno pelo conteudo textual, respeitando completamente o `shouldFilter={false}` e deixando a filtragem customizada (por nome, CPF e CNH) funcionar corretamente.

### Arquivo

| Arquivo | Acao |
|---------|------|
| `src/pages/CollectionOrders.tsx` | Adicionar `value={d.id}` ao `CommandItem` do motorista (~linha 1097) |

Alteracao minima de 1 linha.

