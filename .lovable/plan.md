

## Plano de Implementação - Envio de Código de Recuperação por E-mail

---

## Resumo

Atualmente, o código de recuperação de senha está sendo exibido diretamente na tela após a geração. Conforme solicitado, o código deve ser enviado para o e-mail do usuário e **nunca** exibido na interface.

| Item | Tipo | Complexidade |
|------|------|--------------|
| Configurar chave API do Resend | Configuração | Baixa |
| Criar Edge Function para envio de e-mail | Nova Função | Média |
| Atualizar página ForgotPassword | Modificação | Baixa |

---

## Fluxo Atualizado

```text
+-------------------+     +--------------------+     +------------------+
|   ForgotPassword  | --> | send-password-     | --> |     Resend       |
|   (Frontend)      |     | reset Edge Func    |     |   (E-mail API)   |
+-------------------+     +--------------------+     +------------------+
        |                         |                        |
        v                         v                        v
+-------------------+     +--------------------+     +------------------+
| Gera código       |     | Salva token no DB  |     | Usuário recebe   |
| Chama Edge Func   |     | Envia e-mail       |     | código no e-mail |
+-------------------+     +--------------------+     +------------------+
```

---

## 1. Pré-requisito: Configurar Resend

Antes de implementar, você precisará:

1. Criar conta em **resend.com**
2. Validar seu domínio de e-mail em https://resend.com/domains
3. Criar uma API Key em https://resend.com/api-keys
4. Fornecer a API Key quando solicitado

---

## 2. Criar Edge Function: `send-password-reset`

### Arquivo: `supabase/functions/send-password-reset/index.ts`

**Funcionalidades:**
- Receber e-mail do destinatário e código de recuperação
- Enviar e-mail formatado usando Resend
- Retornar status de sucesso/erro

**Template do e-mail:**
```text
Assunto: Código de Recuperação - Mutlog

Olá,

Você solicitou a recuperação de senha da sua conta Mutlog.

Seu código de recuperação é: XXXXXX

Este código expira em 1 hora.

Se você não solicitou esta recuperação, ignore este e-mail.

Atenciosamente,
Equipe Mutlog
```

---

## 3. Atualizar ForgotPassword.tsx

### Mudanças:

**Antes:**
- Gerar código no frontend
- Salvar token no banco
- Exibir código na tela

**Depois:**
- Verificar se usuário existe
- Gerar código no frontend
- Salvar token no banco
- Chamar Edge Function para enviar e-mail
- Exibir mensagem de sucesso (sem mostrar o código)

### Nova tela após envio:

```text
+------------------------------------------+
|              ✅                          |
|        E-mail Enviado!                   |
+------------------------------------------+
|                                          |
|  Enviamos um código de recuperação       |
|  para o e-mail:                          |
|                                          |
|  bs.suporte.tec@gmail.com                |
|                                          |
|  Verifique sua caixa de entrada          |
|  (e também a pasta de spam).             |
|                                          |
|  O código expira em 1 hora.              |
|                                          |
|     [ Inserir Código ]                   |
|                                          |
|     Voltar para login                    |
|                                          |
+------------------------------------------+
```

---

## 4. Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/send-password-reset/index.ts` | Criar | Edge Function para envio de e-mail |
| `supabase/config.toml` | Modificar | Registrar nova Edge Function |
| `src/pages/ForgotPassword.tsx` | Modificar | Remover exibição do código, chamar Edge Function |

---

## 5. Ordem de Implementação

1. Solicitar chave API do Resend ao usuário
2. Criar Edge Function `send-password-reset`
3. Atualizar `supabase/config.toml`
4. Modificar `ForgotPassword.tsx` para:
   - Chamar Edge Function em vez de exibir código
   - Mostrar mensagem de "e-mail enviado"
   - Redirecionar para página de redefinição

---

## 6. Considerações de Segurança

| Item | Implementação |
|------|---------------|
| Código nunca exibido | Removido completamente da interface |
| E-mail mascarado | Mostrar parcialmente (ex: bs.***@gmail.com) |
| Token único | Código de 6 dígitos com expiração |
| Proteção contra spam | Rate limiting pode ser adicionado futuramente |

---

## Próximo Passo

Para prosseguir, preciso que você forneça a **chave de API do Resend**. Após criar sua conta em resend.com:

1. Valide seu domínio em https://resend.com/domains
2. Crie uma API Key em https://resend.com/api-keys
3. Me informe que está pronto para inserir a chave

