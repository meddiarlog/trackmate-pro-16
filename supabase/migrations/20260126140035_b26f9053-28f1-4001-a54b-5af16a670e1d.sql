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

-- Policy temporaria (permissiva para desenvolvimento)
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