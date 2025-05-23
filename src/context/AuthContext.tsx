// src/context/AuthContext.tsx - Versão atualizada com melhorias
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService, { 
  LoginData, 
  RegisterData, 
  ResetPasswordData, 
  NewPasswordData,
  VerifyResetCodeData 
} from '../services/authService';
import { useCategories } from './CategoryContext';
import backupService from '../services/backupService';
import notificationService from '../services/notificationService';
import { storeData, getData } from '../utils/storage';

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
  verifyResetCode: (data: VerifyResetCodeData) => Promise<void>;
  resetPassword: (data: NewPasswordData) => Promise<void>;
  refreshUserData: () => Promise<void>;
  updateUserProfile: (data: { name?: string; email?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { initializeDefaultCategories } = useCategories();

  useEffect(() => {
    async function loadStorageData() {
      try {
        // Inicializar token a partir do AsyncStorage
        await authService.setupTokenFromStorage();
        
        // Buscar dados do usuário
        const userData = await authService.getUserData();
        
        if (userData) {
          setUser(userData);
          
          // Configurar serviços após login
          await setupUserServices();
        }
      } catch (error) {
        console.error('Erro ao carregar dados da sessão:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();
  }, []);

  // Configurar serviços específicos do usuário após login
  const setupUserServices = async () => {
    try {
      // Configurar backup automático
      await backupService.setupAutoBackup(true);
      
      // Configurar notificações
      await notificationService.setupNotifications();
      
      // Registrar handlers de notificação
      const cleanupNotifications = notificationService.registerNotificationHandlers();
      
      // Salvar função de limpeza
      storeData('@FinanceApp:notificationCleanup', 'registered');
      
      console.log('Serviços do usuário configurados com sucesso');
    } catch (error) {
      console.error('Erro ao configurar serviços do usuário:', error);
    }
  };

  async function signIn(data: LoginData) {
    try {
      setLoading(true);
      const response = await authService.login(data);
      setUser(response.user);
      
      // Configurar serviços após login bem-sucedido
      await setupUserServices();
      
      // Inicializar categorias padrão se necessário
      try {
        await initializeDefaultCategories();
      } catch (categoriesError) {
        console.error('Erro ao inicializar categorias:', categoriesError);
        // Continuar mesmo se houver erro nas categorias
      }
      
      // Fazer backup inicial após login
      setTimeout(async () => {
        try {
          await backupService.createLocalBackup();
          console.log('Backup inicial criado após login');
        } catch (backupError) {
          console.error('Erro no backup inicial:', backupError);
        }
      }, 5000);
      
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
      
      // Configurar serviços para novo usuário
      await setupUserServices();
      
      // Inicializar categorias padrão para novo usuário
      try {
        console.log("Inicializando categorias padrão para novo usuário");
        await initializeDefaultCategories();
      } catch (categoriesError) {
        console.error('Erro ao inicializar categorias padrão:', categoriesError);
        // Continuar mesmo se houver erro
      }
      
      // Criar backup inicial para novo usuário
      setTimeout(async () => {
        try {
          await backupService.createLocalBackup();
          console.log('Backup inicial criado para novo usuário');
        } catch (backupError) {
          console.error('Erro no backup inicial para novo usuário:', backupError);
        }
      }, 3000);
      
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      setLoading(true);
      
      // Fazer backup antes de sair (opcional)
      try {
        await backupService.createLocalBackup();
        console.log('Backup criado antes do logout');
      } catch (backupError) {
        console.error('Erro no backup antes do logout:', backupError);
      }
      
      // Limpar dados de autenticação
      await authService.logout();
      setUser(null);
      
      // Limpar configurações de serviços
      await cleanupUserServices();
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  }

  // Limpar serviços específicos do usuário após logout
  const cleanupUserServices = async () => {
    try {
      // Parar backup automático
      await backupService.setupAutoBackup(false);
      
      // Cancelar todas as notificações agendadas
      await notificationService.setNotificationsEnabled(false);
      
      console.log('Serviços do usuário limpos com sucesso');
    } catch (error) {
      console.error('Erro ao limpar serviços do usuário:', error);
    }
  };

  async function requestReset(data: ResetPasswordData) {
    try {
      await authService.requestPasswordReset(data);
    } catch (error) {
      throw error;
    }
  }

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

  // Atualizar dados do usuário do servidor
  async function refreshUserData() {
    try {
      if (!user) return;
      
      const userData = await authService.getUserData();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      throw error;
    }
  }

  // Atualizar perfil do usuário
  async function updateUserProfile(data: { name?: string; email?: string }) {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      
      // Aqui você implementaria a chamada para a API de atualização de perfil
      // const updatedUser = await authService.updateProfile(data);
      
      // Por enquanto, atualizamos localmente
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      
      // Salvar no storage local
      await storeData('@FinanceApp:userData', updatedUser);
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
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
      verifyResetCode,
      resetPassword,
      refreshUserData,
      updateUserProfile
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