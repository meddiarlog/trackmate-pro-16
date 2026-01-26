import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuthUser {
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'mutlog_session';
const SESSION_EXPIRY_HOURS = 8;

interface StoredSession {
  user: AuthUser;
  expiresAt: number;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      try {
        const storedSession = sessionStorage.getItem(SESSION_KEY);
        if (storedSession) {
          const session: StoredSession = JSON.parse(storedSession);
          if (session.expiresAt > Date.now()) {
            setUser(session.user);
          } else {
            sessionStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        sessionStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('system_users')
        .select('id, name, email, password_hash, group_id, is_active')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user:', userError);
        return { success: false, error: 'Erro ao verificar credenciais.' };
      }

      if (!userData) {
        return { success: false, error: 'E-mail ou senha inválidos.' };
      }

      if (!userData.is_active) {
        return { success: false, error: 'Usuário inativo. Entre em contato com o administrador.' };
      }

      // Verify password using Edge Function
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('hash-password', {
        body: {
          password,
          hashToCompare: userData.password_hash,
          action: 'compare'
        }
      });

      if (verifyError) {
        console.error('Error verifying password:', verifyError);
        return { success: false, error: 'Erro ao verificar credenciais.' };
      }

      if (!verifyData?.isMatch) {
        return { success: false, error: 'E-mail ou senha inválidos.' };
      }

      // Create session
      const authUser: AuthUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        group_id: userData.group_id,
        is_active: userData.is_active
      };

      const session: StoredSession = {
        user: authUser,
        expiresAt: Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
      };

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setUser(authUser);

      // Update last_login
      await supabase
        .from('system_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro inesperado ao fazer login.' };
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, ...data };
      
      // Update session storage
      const storedSession = sessionStorage.getItem(SESSION_KEY);
      if (storedSession) {
        const session: StoredSession = JSON.parse(storedSession);
        session.user = updatedUser;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
      
      return updatedUser;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
