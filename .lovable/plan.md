

## Plano de Implementacao - Melhorias no Modulo de Cotacao

---

## Resumo

Transformar o campo "Tipo de Servico" de select unico para multipla escolha por checkbox, adicionar novos tipos de servico (Carregamento e Descarga) com valores individuais, e incluir checkboxes de responsabilidade para Carga e Descarga.

| Alteracao | Complexidade |
|-----------|--------------|
| Banco de dados: novas colunas | Baixa |
| Formulario: checkboxes de servico + valores dinamicos | Media |
| Checkboxes de Carga/Descarga com responsabilidade | Baixa |
| Totalizacao automatica | Baixa |
| Listagem e impressao atualizadas | Baixa |

---

## 1. Alteracoes no Banco de Dados

**Tabela:** `quotes`

Novas colunas a adicionar:

| Coluna | Tipo | Default | Descricao |
|--------|------|---------|-----------|
| service_transporte | BOOLEAN | false | Servico de transporte selecionado |
| service_munck | BOOLEAN | false | Servico de munck selecionado |
| service_carregamento | BOOLEAN | false | Servico de carregamento selecionado |
| service_descarga | BOOLEAN | false | Servico de descarga selecionado |
| carregamento_value | NUMERIC | 0 | Valor do carregamento |
| descarga_value | NUMERIC | 0 | Valor da descarga |
| carga_responsavel | TEXT | NULL | "contratante" ou "contratado" |
| descarga_responsavel | TEXT | NULL | "contratante" ou "contratado" |

**Migracao SQL:**

```sql
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS service_transporte BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS service_munck BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS service_carregamento BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS service_descarga BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS carregamento_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS descarga_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS carga_responsavel TEXT,
ADD COLUMN IF NOT EXISTS descarga_responsavel TEXT;

-- Migrar dados existentes baseado no service_type atual
UPDATE public.quotes SET service_transporte = true WHERE service_type = 'transporte';
UPDATE public.quotes SET service_munck = true WHERE service_type = 'munck';
```

O campo `service_type` existente sera mantido para compatibilidade mas gerado automaticamente a partir dos checkboxes.

---

## 2. Formulario - Checkboxes de Servico

Substituir o Select de "Tipo de Servico" por checkboxes:

```text
+------------------------------------------+
| Tipo de Servico                          |
+------------------------------------------+
| [x] Transporte   [ ] Munck              |
| [ ] Carregamento  [ ] Descarga          |
+------------------------------------------+
```

**Estado no formData:**

```typescript
// Substituir service_type por:
service_transporte: false,
service_munck: false,
service_carregamento: false,
service_descarga: false,
carregamento_value: "",
descarga_value: "",
carga_responsavel: "",
descarga_responsavel: "",
```

**Exibicao dinamica de valores:**

- Se "Transporte" marcado: exibir campo "Valor de Frete (R$)"
- Se "Munck" marcado: exibir campo "Valor de Servico de Munck (R$)"
- Se "Carregamento" marcado: exibir campo "Valor de Carregamento (R$)"
- Se "Descarga" marcado: exibir campo "Valor de Descarga (R$)"

**Totalizacao automatica:**

```text
+------------------------------------------+
| Valores                                  |
+------------------------------------------+
| Frete:         R$ 5.000,00              |
| Munck:         R$ 1.200,00              |
| Carregamento:  R$ 800,00               |
|                                          |
| TOTAL:         R$ 7.000,00              |
+------------------------------------------+
```

O total e calculado em tempo real somando todos os valores dos servicos selecionados.

---

## 3. Checkboxes de Carga e Descarga (Responsabilidade)

Secao separada, abaixo dos valores:

```text
+------------------------------------------+
| Responsabilidade                         |
+------------------------------------------+
| [x] Carga                               |
|     ( ) Por Conta do Contratante        |
|     (x) Por Conta do Contratado         |
|                                          |
| [x] Descarga                            |
|     (x) Por Conta do Contratante        |
|     ( ) Por Conta do Contratado         |
+------------------------------------------+
```

- Ao marcar "Carga", exibir radio buttons de responsabilidade
- Ao marcar "Descarga", exibir radio buttons de responsabilidade
- Ambos podem ser marcados simultaneamente

---

## 4. Salvamento (Payload)

```typescript
const payload = {
  // ... campos existentes
  service_transporte: formData.service_transporte,
  service_munck: formData.service_munck,
  service_carregamento: formData.service_carregamento,
  service_descarga: formData.service_descarga,
  // Gerar service_type como string para compatibilidade
  service_type: buildServiceTypeString(),
  freight_value: formData.service_transporte ? parseFloat(formData.freight_value) || 0 : 0,
  munck_value: formData.service_munck ? parseFloat(formData.munck_value) || 0 : 0,
  carregamento_value: formData.service_carregamento ? parseFloat(formData.carregamento_value) || 0 : 0,
  descarga_value: formData.service_descarga ? parseFloat(formData.descarga_value) || 0 : 0,
  carga_responsavel: formData.carga_responsavel || null,
  descarga_responsavel: formData.descarga_responsavel || null,
};
```

A funcao `buildServiceTypeString()` gera uma string como "transporte, munck" para compatibilidade com a coluna existente.

---

## 5. Listagem (Tabela)

A coluna "Servico" exibira os tipos selecionados separados por virgula:

```text
| Servico                    |
|----------------------------|
| Transporte, Munck          |
| Carregamento, Descarga     |
| Transporte                 |
```

A coluna "Valor" exibira o total de todos os servicos.

---

## 6. Impressao (QuotePrintView)

Atualizar a interface Quote e a secao de valores para:

- Listar cada servico selecionado com seu valor individual
- Exibir linha de totalizacao
- Mostrar responsabilidades de Carga/Descarga quando preenchidas
- Manter formatacao brasileira (R$)

```text
+------------------------------------------+
| VALORES                                  |
+------------------------------------------+
| Frete:            R$ 5.000,00           |
| Munck:            R$ 1.200,00           |
| Carregamento:     R$ 800,00            |
| ----------------------------------------|
| VALOR TOTAL:      R$ 7.000,00          |
+------------------------------------------+
| Carga: Por Conta do Contratado          |
| Descarga: Por Conta do Contratante      |
+------------------------------------------+
```

---

## 7. Edicao de Registros Existentes

Ao abrir um registro existente para edicao:
- Se possuir os campos booleanos novos, usar diretamente
- Se nao (registros antigos), inferir dos campos `service_type`, `freight_value` e `munck_value`

```typescript
// handleEdit - compatibilidade retroativa
service_transporte: quote.service_transporte ?? (quote.service_type === 'transporte'),
service_munck: quote.service_munck ?? (quote.service_type === 'munck'),
service_carregamento: quote.service_carregamento ?? false,
service_descarga: quote.service_descarga ?? false,
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `quotes` (tabela) | Adicionar 8 colunas |
| `src/pages/Quotes.tsx` | Formulario, listagem, payload |
| `src/components/QuotePrintView.tsx` | Impressao com novos campos |

---

## Validacoes

| Regra | Descricao |
|-------|-----------|
| Ao menos 1 servico | Pelo menos um checkbox de servico deve ser marcado |
| Origem/Destino | Obrigatorios apenas se "Transporte" estiver marcado |
| Valores zerados | Servicos nao marcados salvam valor 0 |
| Responsabilidade | Radio buttons so aparecem quando checkbox correspondente esta marcado |

