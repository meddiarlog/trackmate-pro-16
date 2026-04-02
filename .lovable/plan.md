
Problema real: a busca por nome até está sendo executada, mas a lógica atual invalida o filtro.

O que identifiquei em `src/pages/CollectionOrders.tsx`:
- O filtro do motorista faz 3 verificações:
  - nome: `d.name?.toLowerCase().includes(search)`
  - CPF: `normalizedCpf.includes(normalizedSearch)`
  - CNH: `normalizedCnh.includes(normalizedSearch)`
- Quando o usuário digita um nome, por exemplo `CARLOS ALBERTO`, `normalizedSearch` vira string vazia (`""`) porque remove tudo que não é número.
- Em JavaScript, `"qualquercoisa".includes("")` retorna `true`.
- Resultado: a parte de CPF/CNH passa para praticamente todos os motoristas, então a lista deixa de filtrar corretamente por nome.

Do I know what the issue is?
Sim.

Correção proposta:
1. Ajustar o filtro do motorista para só consultar CPF/CNH quando a busca tiver dígitos.
2. Manter a busca por nome funcionando com texto livre.
3. Aplicar o mesmo cuidado na busca de veículos, porque ali existe o mesmo risco de comportamento inconsistente em filtros mistos.

Implementação sugerida:
- Em `src/pages/CollectionOrders.tsx`, trocar a condição atual por algo neste padrão:

```ts
const filtered = drivers.filter((d: any) => {
  if (!driverSearch) return true;

  const search = driverSearch.toLowerCase().trim();
  const normalizedSearch = driverSearch.replace(/\D/g, "");
  const normalizedCpf = d.cpf?.replace(/\D/g, "") || "";
  const normalizedCnh = d.cnh?.replace(/\D/g, "") || "";

  const nameMatch = d.name?.toLowerCase().includes(search);
  const cpfMatch = normalizedSearch.length > 0 && normalizedCpf.includes(normalizedSearch);
  const cnhMatch = normalizedSearch.length > 0 && normalizedCnh.includes(normalizedSearch);

  return nameMatch || cpfMatch || cnhMatch;
});
```

Arquivos a revisar/ajustar:
- `src/pages/CollectionOrders.tsx`

Resultado esperado após a correção:
- Buscar por nome: retorna apenas motoristas cujo nome contém o texto digitado
- Buscar por CPF: retorna por números do CPF
- Buscar por CNH: retorna por números da CNH
- Busca vazia: lista completa

Detalhe técnico:
A causa não é o componente visual do campo, e sim a lógica do `.includes("")`, que em JavaScript sempre retorna `true`. Por isso as tentativas anteriores no input/popover não resolveram o problema de forma definitiva.
