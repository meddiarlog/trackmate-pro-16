# Tornar UF do destinatário opcional

Atualmente UF é o único campo obrigatório do destinatário. Vamos removê-lo da validação.

## Mudanças em `src/pages/CollectionOrders.tsx`

1. **`handleSubmit`** (linhas ~812-824): Remover o loop que valida `r.state`. Manter apenas a verificação de existência de pelo menos 1 destinatário.

2. **Label da UF** (linha ~1188): Trocar `UF *` por `UF`.

Nenhuma mudança de banco — `state` já é nullable.
