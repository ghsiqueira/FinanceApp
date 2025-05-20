// src/context/AuthContext.tsx - Atualizado para incluir verifyResetCode
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService, { 
  LoginData, 
  RegisterData, 
  ResetPasswordData, 
  NewPasswordData,
  VerifyResetCodeData 
} from '../services/authService';
import { useCategories } from './CategoryContext';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextData {
  signed: boolean;
  user: User | null;
  loading: boolean;
  signIn: (data: LoginData) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
  requestReset: (data: ResetPasswordData) => Promise<void>;
  verifyResetCode: (data: VerifyResetCodeData) => Promise<void>; // Novo método
  resetPassword: (data: NewPasswordData) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        // Inicializar token a partir do AsyncStorage
        await authService.setupTokenFromStorage();
        
        // Buscar dados do usuário
        const userData = await authService.getUserData();
        
        if (userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da sessão:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();
  }, []);

  async function signIn(data: LoginData) {
    try {
      setLoading(true);
      const response = await authService.login(data);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(data: RegisterData) {
    try {
      setLoading(true);
      const response = await authService.register(data);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  }

  async function requestReset(data: ResetPasswordData) {
    try {
      await authService.requestPasswordReset(data);
    } catch (error) {
      throw error;
    }
  }

  // Novo método para verificar código
  async function verifyResetCode(data: VerifyResetCodeData) {
    try {
      await authService.verifyResetCode(data);
    } catch (error) {
      throw error;
    }
  }

  async function resetPassword(data: NewPasswordData) {
    try {
      await authService.resetPassword(data);
    } catch (error) {
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ 
      signed: !!user, 
      user, 
      loading,
      signIn,
      signUp,
      signOut,
      requestReset,
      verifyResetCode, // Adicionando o novo método
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
}