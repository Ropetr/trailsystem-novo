/**
 * TrailSystem - Auth Context
 * Gerenciamento de estado de autenticação
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  uuid: string;
  name: string;
  email: string;
  role: string;
  type: 'admin' | 'tenant';
  tenant?: {
    uuid: string;
    name: string;
    status: string;
  };
  modules?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; userType?: string }>;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('trailsystem_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const response = await api.me();
      if (response.success && response.data) {
        const data = response.data as any;
        setUser({
          uuid: data.sub,
          name: data.name,
          email: data.email,
          role: data.role,
          type: data.type || (data.is_platform_admin ? 'admin' : 'tenant'),
          tenant: data.tenantId ? {
            uuid: data.tenantId,
            name: data.tenantName,
            status: 'active',
          } : undefined,
          modules: data.modules,
        });
      } else {
        setUser(null);
        localStorage.removeItem('trailsystem_token');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      localStorage.removeItem('trailsystem_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      
      if (response.success && response.data) {
        const data = response.data as any;
        const userType = data.type || 'tenant';
        
        setUser({
          uuid: data.uuid,
          name: data.name,
          email: data.email,
          role: data.role,
          type: userType,
          tenant: data.tenant,
          modules: data.modules,
        });
        return { success: true, userType };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Erro ao fazer login' };
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const response = await api.adminLogin(email, password);
      
      if (response.success && response.data) {
        const data = response.data as any;
        setUser({
          uuid: data.uuid,
          name: data.name,
          email: data.email,
          role: data.role,
          type: 'admin',
        });
        return { success: true };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Erro ao fazer login' };
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        adminLogin,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
