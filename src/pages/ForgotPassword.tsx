import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ForgotPassword() {
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!email.trim()) {
      setError('E-mail é obrigatório');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('E-mail inválido');
      return false;
    }
    setError('');
    return true;
  };

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsLoading(true);
    
    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('system_users')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (userError) {
        throw userError;
      }

      if (!userData) {
        toast({
          title: 'E-mail não encontrado',
          description: 'Não existe um usuário cadastrado com este e-mail.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Generate reset code
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to database
      const { error: tokenError } = await supabase
        .from('password_reset_tokens')
        .insert({
          user_id: userData.id,
          token: code,
          expires_at: expiresAt.toISOString(),
        });

      if (tokenError) {
        throw tokenError;
      }

      // In development, show the code; in production, this would be sent via email
      setResetCode(code);
      setIsSubmitted(true);
      
      toast({
        title: 'Código gerado com sucesso!',
        description: 'Use o código para redefinir sua senha.',
      });
    } catch (error) {
      console.error('Error generating reset code:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao gerar o código de recuperação.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-500 rounded-full p-3">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl">Código Gerado!</CardTitle>
              <CardDescription className="text-base">
                Use o código abaixo para redefinir sua senha.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {resetCode && (
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Seu código de recuperação:</p>
                <p className="text-3xl font-mono font-bold tracking-widest">{resetCode}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Este código expira em 1 hora.
                </p>
              </div>
            )}
            
            <Button asChild className="w-full">
              <Link to="/reset-password">
                Redefinir Senha
              </Link>
            </Button>
            
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-3">
              <Truck className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl">Recuperar Senha</CardTitle>
            <CardDescription className="text-base">
              Digite seu e-mail cadastrado para receber o código de recuperação.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                className={error ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Código'
              )}
            </Button>
            
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
