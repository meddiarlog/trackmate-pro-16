

## Plano - Título de Contato Editável

### O que muda

Tornar o rótulo "Contato 1", "Contato 2", etc. editável pelo usuário. Se não for editado, mantém o valor padrão.

### Alterações

| Arquivo | Ação |
|---------|------|
| `src/components/CustomerContactList.tsx` | Adicionar campo `label` à interface `Contact` e substituir o `<span>` estático por um `<Input>` inline editável |

### Detalhes

1. **Interface `Contact`**: adicionar `label?: string`

2. **Ao adicionar contato**: definir label padrão vazio (será exibido como "Contato N" via placeholder)

3. **No render**: substituir `<span>Contato {index + 1}</span>` por um input inline sem borda:
   ```tsx
   <Input
     value={contact.label || ""}
     onChange={(e) => updateContact(index, "label", e.target.value)}
     placeholder={`Contato ${index + 1}`}
     className="h-8 border-0 bg-transparent p-0 text-sm font-medium text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 w-auto max-w-[200px]"
   />
   ```

O campo fica visualmente idêntico ao texto atual quando não está em foco, mas ao clicar o usuário pode renomear livremente (ex: "Contato de Cobrança").

