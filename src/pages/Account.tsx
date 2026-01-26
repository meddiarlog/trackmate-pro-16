import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Eye, EyeOff, User, Mail, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Account() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailErrors, setEmailErrors] = useState<{ email?: string; password?: string }>({});
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});

  // User group name
  const [groupName, setGroupName] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupName = async () => {
      if (user?.group_id) {
        const { data } = await supabase
          .from('user_groups')
          .select('name')
          .eq('id', user.group_id)
          .maybeSingle();
        if (data) {
          setGroupName(data.name);
        }
      }
    };
    fetchGroupName();
  }, [user?.group_id]);

  const validateEmail = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!newEmail.trim()) {
      errors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      errors.email = 'E-mail inválido';
    } else if (newEmail.toLowerCase() === user?.email.toLowerCase()) {
      errors.email = 'Novo e-mail deve ser diferente do atual';
    }
    
    if (!emailCurrentPassword) {
      errors.password = 'Senha atual é obrigatória';
    }
    
    setEmailErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors: { current?: string; new?: string; confirm?: string } = {};
    
    if (!currentPassword) {
      errors.current = 'Senha atual é obrigatória';
    }
    
    if (!newPassword) {
      errors.new = 'Nova senha é obrigatória';
    } else if (newPassword.length < 6) {
      errors.new = 'Senha deve ter no mínimo 6 caracteres';
    } else if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      errors.new = 'Senha deve conter letras e números';
    }
    
    if (!confirmPassword) {
      errors.confirm = 'Confirmação de senha é obrigatória';
    } else if (confirmPassword !== newPassword) {
      errors.confirm = 'Senhas não conferem';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const verifyCurrentPassword = async (password: string): Promise<boolean> => {
    if (!user) return false;
    
    const { data: userData } = await supabase
      .from('system_users')
      .select('password_hash')
      .eq('id', user.id)
      .single();
    
    if (!userData) return false;
    
    const { data: verifyData } = await supabase.functions.invoke('hash-password', {
      body: {
        password,
        hashToCompare: userData.password_hash,
        action: 'compare'
      }
    });
    
    return verifyData?.isMatch === true;
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail() || !user) return;
    
    setIsChangingEmail(true);
    
    try {
      // Verify current password
      const isPasswordValid = await verifyCurrentPassword(emailCurrentPassword);
      if (!isPasswordValid) {
        toast({
          title: 'Senha incorreta',
          description: 'A senha atual informada está incorreta.',
          variant: 'destructive',
        });
        setIsChangingEmail(false);
        return;
      }
      
      // Check if email is already in use
      const { data: existingUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', newEmail.toLowerCase().trim())
        .neq('id', user.id)
        .maybeSingle();
      
      if (existingUser) {
        toast({
          title: 'E-mail já cadastrado',
          description: 'Este e-mail já está sendo utilizado por outro usuário.',
          variant: 'destructive',
        });
        setIsChangingEmail(false);
        return;
      }
      
      // Update email
      const { error: updateError } = await supabase
        .from('system_users')
        .update({ email: newEmail.toLowerCase().trim() })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      updateUser({ email: newEmail.toLowerCase().trim() });
      setNewEmail('');
      setEmailCurrentPassword('');
      
      toast({
        title: 'E-mail alterado!',
        description: 'Seu e-mail foi atualizado com sucesso.',
      });
    } catch (error) {
      console.error('Error changing email:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao alterar o e-mail.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword() || !user) return;
    
    setIsChangingPassword(true);
    
    try {
      // Verify current password
      const isPasswordValid = await verifyCurrentPassword(currentPassword);
      if (!isPasswordValid) {
        toast({
          title: 'Senha incorreta',
          description: 'A senha atual informada está incorreta.',
          variant: 'destructive',
        });
        setIsChangingPassword(false);
        return;
      }
      
      // Hash new password
      const { data: hashData, error: hashError } = await supabase.functions.invoke('hash-password', {
        body: { password: newPassword }
      });
      
      if (hashError || !hashData?.hash) {
        throw new Error('Failed to hash password');
      }
      
      // Update password
      const { error: updateError } = await supabase
        .from('system_users')
        .update({ password_hash: hashData.hash })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi atualizada com sucesso.',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao alterar a senha.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Minha Conta</h1>
      
      {/* User Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Nome:</span>
            <span className="font-medium">{user.name}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">E-mail:</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Grupo:</span>
            <span className="font-medium">{groupName || 'Nenhum'}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Change Email Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Alterar E-mail
          </CardTitle>
          <CardDescription>
            Atualize seu endereço de e-mail. Você precisará informar sua senha atual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">Novo E-mail</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="novo@email.com"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  if (emailErrors.email) setEmailErrors(prev => ({ ...prev, email: undefined }));
                }}
                className={emailErrors.email ? 'border-destructive' : ''}
                disabled={isChangingEmail}
              />
              {emailErrors.email && (
                <p className="text-sm text-destructive">{emailErrors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emailCurrentPassword">Senha Atual</Label>
              <Input
                id="emailCurrentPassword"
                type="password"
                placeholder="••••••••"
                value={emailCurrentPassword}
                onChange={(e) => {
                  setEmailCurrentPassword(e.target.value);
                  if (emailErrors.password) setEmailErrors(prev => ({ ...prev, password: undefined }));
                }}
                className={emailErrors.password ? 'border-destructive' : ''}
                disabled={isChangingEmail}
              />
              {emailErrors.password && (
                <p className="text-sm text-destructive">{emailErrors.password}</p>
              )}
            </div>
            
            <Button type="submit" disabled={isChangingEmail}>
              {isChangingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar E-mail'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Atualize sua senha de acesso. A nova senha deve ter no mínimo 6 caracteres com letras e números.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.current) setPasswordErrors(prev => ({ ...prev, current: undefined }));
                  }}
                  className={passwordErrors.current ? 'border-destructive pr-10' : 'pr-10'}
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.current && (
                <p className="text-sm text-destructive">{passwordErrors.current}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordErrors.new) setPasswordErrors(prev => ({ ...prev, new: undefined }));
                  }}
                  className={passwordErrors.new ? 'border-destructive pr-10' : 'pr-10'}
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.new && (
                <p className="text-sm text-destructive">{passwordErrors.new}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirm) setPasswordErrors(prev => ({ ...prev, confirm: undefined }));
                  }}
                  className={passwordErrors.confirm ? 'border-destructive pr-10' : 'pr-10'}
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.confirm && (
                <p className="text-sm text-destructive">{passwordErrors.confirm}</p>
              )}
            </div>
            
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
