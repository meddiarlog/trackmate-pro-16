

## Plano — Coluna "Crédito Utilizado Em"

### Resumo

Adicionar uma coluna após o ID na tabela de Controle de Crédito que mostra em qual crédito salvo cada NF-e foi utilizada. O preenchimento é automático ao salvar um crédito utilizado.

### Abordagem

Em vez de adicionar uma coluna no banco (redundância), buscar a informação via lookup: ao carregar a página, consultar `saved_credit_items` agrupando por `credit_control_id` e cruzar com `saved_credits.name`. Isso garante que a coluna sempre reflete o estado real.

### Alterações

| Arquivo | Ação |
|---------|------|
| `src/pages/CreditControl.tsx` | Buscar mapa de `credit_control_id → nome do crédito salvo` e adicionar coluna na tabela |

### Detalhes

1. **Novo fetch** — Ao carregar registros (e quando `savedCreditsRefreshKey` mudar), buscar todos os `saved_credit_items` com join no `saved_credits`:
   ```ts
   const { data } = await supabase
     .from("saved_credit_items")
     .select("credit_control_id, saved_credit_id, saved_credits(name)");
   ```
   Montar um `Map<string, string>` de `credit_control_id → name`.

2. **Nova coluna** — Inserir após a coluna ID:
   ```ts
   {
     key: "creditoUtilizadoEm",
     header: "Crédito Utilizado Em",
     sortable: false,
     render: (item) => {
       const name = usedCreditMap.get(item.id);
       return name
         ? <Badge variant="secondary">{name}</Badge>
         : <span className="text-muted-foreground text-xs">Não utilizado</span>;
     },
   }
   ```

3. **Refresh automático** — O mapa é recalculado sempre que `savedCreditsRefreshKey` incrementa (ou seja, quando o usuário salva um crédito), garantindo que a coluna atualiza imediatamente.

### Resultado esperado
- NF-e não vinculada: exibe "Não utilizado" em cinza
- NF-e vinculada: exibe o nome do crédito salvo como badge

