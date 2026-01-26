

## Plano de Implementacao - Modulo Minha Conta e Autenticacao Mutlog

---

## Resumo Executivo

Este plano implementa o sistema completo de autenticacao e gerenciamento de conta do usuario:

| Componente | Tipo | Prioridade | Complexidade |
|------------|------|------------|--------------|
| Tela de Login | Nova Pagina | Alta | Media |
| Hook de Autenticacao | Novo Hook | Alta | Media |
| Contexto de Autenticacao | Novo Contexto | Alta | Media |
| Modulo Minha Conta | Nova Pagina | Alta | Media |
| Recuperacao de Senha | Nova Pagina + Edge Function | Media | Alta |
| Protecao de Rotas | Modificacao | Alta | Baixa |

---

## Arquitetura de Autenticacao

```text
+-------------------+     +------------------+     +------------------+
|   Login Page      | --> |  Auth Context    | --> |  Protected       |
|   /login          |     |  useAuth hook    |     |  Layout          |
+-------------------+     +------------------+     +------------------+
        |                         |                        |
        v                         v                        v
+-------------------+     +------------------+     +------------------+
|  hash-password    |     |  localStorage    |     |  Dashboard +     |
|  Edge Function    |     |  (session only)  |     |  All Modules     |
+-------------------+     +------------------+     +------------------+
```

**Fluxo de Autenticacao:**
1. Usuario acessa mutlog.com.br
2. Sistema verifica se existe sessao ativa (via AuthContext)
3. Se NAO autenticado -> redireciona para /login
4. Se autenticado -> exibe Dashboard e modulos

---

## 1. Criacao do Contexto de Autenticacao

### Arquivo: `src/contexts/AuthContext.tsx`

**Responsabilidades:**
- Gerenciar estado de autenticacao (usuario logado/nao logado)
- Armazenar dados do usuario autenticado
- Prover funcoes de login, logout e verificacao de sessao
- Persistir sessao de forma segura (sessionStorage, nao localStorage)

**Estado gerenciado:**
```typescript
interface AuthUser {
  id: string;
  name: string;
  email: string;
  group_id: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}
```

**Seguranca:**
- Sessao armazenada em sessionStorage (expira ao fechar navegador)
- Token de sessao com expiracao configuravel
- Nunca armazenar senha em memoria ou storage
- Verificacao de senha via Edge Function (bcrypt compare)

---

## 2. Hook de Autenticacao

### Arquivo: `src/hooks/useAuth.ts`

Hook customizado para facilitar acesso ao contexto:

```typescript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 3. Tela de Login

### Arquivo: `src/pages/Login.tsx`

**Interface:**
```text
+------------------------------------------+
|              MUTLOG                       |
|        Sistema de Gestao de Fretes        |
+------------------------------------------+
|                                          |
|     +------------------------------+     |
|     |  Email                       |     |
|     |  [________________________]  |     |
|     +------------------------------+     |
|                                          |
|     +------------------------------+     |
|     |  Senha                       |     |
|     |  [________________________]  |     |
|     +------------------------------+     |
|                                          |
|     [        ENTRAR        ]             |
|                                          |
|     Esqueceu a senha?                    |
|                                          |
+------------------------------------------+
```

**Campos:**
| Campo | Tipo | Validacao |
|-------|------|-----------|
| Email | email | Obrigatorio, formato valido |
| Senha | password | Obrigatorio, min 6 caracteres |

**Comportamento:**
- Validar campos antes de enviar
- Mostrar loading durante autenticacao
- Exibir mensagens de erro claras (credenciais invalidas, usuario inativo)
- Redirecionar para Dashboard apos login bem-sucedido
- Link para recuperacao de senha

---

## 4. Pagina de Recuperacao de Senha

### Arquivo: `src/pages/ForgotPassword.tsx`

**Fluxo em 2 etapas:**

**Etapa 1 - Solicitar Recuperacao:**
```text
+------------------------------------------+
|        Recuperar Senha                    |
+------------------------------------------+
|                                          |
|  Digite seu e-mail cadastrado para       |
|  receber o link de recuperacao.          |
|                                          |
|     +------------------------------+     |
|     |  Email                       |     |
|     |  [________________________]  |     |
|     +------------------------------+     |
|                                          |
|     [    ENVIAR LINK    ]                |
|                                          |
|     Voltar para login                    |
|                                          |
+------------------------------------------+
```

**Etapa 2 - Redefinir Senha:**
```text
+------------------------------------------+
|        Nova Senha                         |
+------------------------------------------+
|                                          |
|     +------------------------------+     |
|     |  Codigo de Recuperacao       |     |
|     |  [________________________]  |     |
|     +------------------------------+     |
|                                          |
|     +------------------------------+     |
|     |  Nova Senha                  |     |
|     |  [________________________]  |     |
|     +------------------------------+     |
|                                          |
|     +------------------------------+     |
|     |  Confirmar Nova Senha        |     |
|     |  [________________________]  |     |
|     +------------------------------+     |
|                                          |
|     [    REDEFINIR SENHA    ]            |
|                                          |
+------------------------------------------+
```

---

## 5. Modulo Minha Conta

### Arquivo: `src/pages/Account.tsx` (atualizar)

**Interface:**
```text
+------------------------------------------+
|        Minha Conta                        |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | Informacoes do Usuario             |  |
|  +------------------------------------+  |
|  | Nome: Bruno                        |  |
|  | Email: bs.suporte.tec@gmail.com    |  |
|  | Grupo: Administrador               |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | Alterar E-mail                     |  |
|  +------------------------------------+  |
|  | Novo E-mail: [___________________] |  |
|  | Senha Atual: [___________________] |  |
|  | [  ALTERAR E-MAIL  ]               |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | Alterar Senha                      |  |
|  +------------------------------------+  |
|  | Senha Atual: [___________________] |  |
|  | Nova Senha: [____________________] |  |
|  | Confirmar:  [____________________] |  |
|  | [  ALTERAR SENHA  ]                |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
```

**Funcionalidades:**
- Exibir dados do usuario logado
- Alterar e-mail (requer senha atual)
- Alterar senha (requer senha atual)

**Validacoes:**
| Campo | Regra |
|-------|-------|
| Senha atual | Obrigatoria para qualquer alteracao |
| Novo e-mail | Formato valido, nao duplicado |
| Nova senha | Min 6 caracteres, letras e numeros |
| Confirmar senha | Igual a nova senha |

---

## 6. Edge Function - Envio de E-mail de Recuperacao

### Arquivo: `supabase/functions/send-password-reset/index.ts`

**Nota:** Para envio de e-mails de recuperacao, sera necessario configurar um servico de e-mail (Resend). O usuario precisara fornecer a chave de API do Resend.

**Alternativa sem e-mail (implementacao inicial):**
- Gerar codigo de recuperacao de 6 digitos
- Armazenar codigo com expiracao na tabela `password_reset_tokens`
- Exibir codigo na tela (para ambiente de desenvolvimento)
- Em producao, enviar via e-mail

### Migracao SQL necessaria:

```sql
-- Tabela para tokens de recuperacao de senha
CREATE TABLE public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.system_users(id) ON DELETE CASCADE NOT NULL,
  token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Policy temporaria
CREATE POLICY "Allow all access to password_reset_tokens" 
ON public.password_reset_tokens FOR ALL USING (true) WITH CHECK (true);

-- Funcao para limpar tokens expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() OR used = true;
$$;
```

---

## 7. Protecao de Rotas

### Modificacao: `src/App.tsx`

**Estrutura atualizada:**

```typescript
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            {/* Rotas publicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Rotas protegidas */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              {/* ... demais rotas ... */}
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
```

### Componente: `src/components/ProtectedRoute.tsx`

```typescript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};
```

---

## 8. Atualizacao do Sidebar - Logout

### Modificacao: `src/components/AppSidebar.tsx`

O item "Sair" no menu deve chamar a funcao `logout()` do AuthContext e redirecionar para /login.

---

## 9. Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/contexts/AuthContext.tsx` | Criar | Contexto de autenticacao |
| `src/hooks/useAuth.ts` | Criar | Hook de autenticacao |
| `src/pages/Login.tsx` | Criar | Tela de login |
| `src/pages/ForgotPassword.tsx` | Criar | Solicitar recuperacao de senha |
| `src/pages/ResetPassword.tsx` | Criar | Redefinir senha |
| `src/pages/Account.tsx` | Modificar | Modulo Minha Conta completo |
| `src/components/ProtectedRoute.tsx` | Criar | Componente de protecao de rotas |
| `src/App.tsx` | Modificar | Adicionar AuthProvider e rotas publicas |
| `src/components/AppSidebar.tsx` | Modificar | Implementar logout funcional |
| Migracao SQL | Criar | Tabela password_reset_tokens |

---

## 10. Ordem de Implementacao

1. **Migracao SQL** - Criar tabela password_reset_tokens
2. **AuthContext e useAuth** - Base do sistema de autenticacao
3. **ProtectedRoute** - Componente de protecao
4. **Login.tsx** - Tela de login funcional
5. **App.tsx** - Integrar AuthProvider e rotas
6. **AppSidebar.tsx** - Implementar logout
7. **Account.tsx** - Modulo Minha Conta
8. **ForgotPassword.tsx e ResetPassword.tsx** - Recuperacao de senha

---

## 11. Consideracoes de Seguranca

| Item | Implementacao |
|------|---------------|
| Armazenamento de sessao | sessionStorage (expira ao fechar navegador) |
| Senhas | Nunca armazenadas em texto, sempre hash bcrypt |
| Comparacao de senha | Via Edge Function (servidor) |
| Tokens de recuperacao | Expiracao de 1 hora, uso unico |
| Validacao de e-mail | Verificar duplicidade antes de alterar |
| Tentativas de login | Estrutura preparada para rate limiting futuro |

---

## 12. Proximos Passos Apos Implementacao

1. Configurar Resend para envio de e-mails em producao
2. Implementar rate limiting para prevenir brute force
3. Adicionar verificacao de permissoes em cada modulo
4. Implementar 2FA (autenticacao de dois fatores)
5. Adicionar captcha na tela de login

