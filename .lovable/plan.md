

## Plano - Corrigir Busca de Motorista por Nome

### Problema

No cmdk v1, o `CommandInput` gerencia o estado de busca internamente. Mesmo com `shouldFilter={false}`, o `value`/`onValueChange` do `CommandInput` pode não estar sincronizando corretamente com o estado `driverSearch`, fazendo com que o filtro customizado não funcione.

### Solução

Substituir o `CommandInput` por um `<Input>` comum (fora do `Command`) para controlar o texto de busca de forma independente do cmdk. Isso garante que o estado `driverSearch` seja atualizado corretamente e o filtro customizado por nome, CPF e CNH funcione.

### Alteração

| Arquivo | Ação |
|---------|------|
| `src/pages/CollectionOrders.tsx` | Substituir `CommandInput` do motorista por `<Input>` controlado + manter `Command shouldFilter={false}` apenas para a lista |

**Estrutura proposta:**
```tsx
<PopoverContent>
  <div className="flex items-center border-b px-3">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <Input
      placeholder="Buscar por nome, CPF ou CNH..."
      value={driverSearch}
      onChange={(e) => setDriverSearch(e.target.value)}
      className="border-0 focus-visible:ring-0"
    />
  </div>
  <Command shouldFilter={false}>
    <CommandList>
      <CommandEmpty>Nenhum motorista encontrado</CommandEmpty>
      <CommandGroup>
        {/* filtro customizado permanece igual */}
      </CommandGroup>
    </CommandList>
  </Command>
</PopoverContent>
```

Isso separa completamente o input de busca do mecanismo interno do cmdk, garantindo que a filtragem por nome, CPF e CNH funcione corretamente.

