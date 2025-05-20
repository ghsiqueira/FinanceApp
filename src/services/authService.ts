// src/services/authService.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@FinanceApp:authToken';
const USER_DATA_KEY = '@FinanceApp:userData';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface NewPasswordData {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const authService = {
  // Registro de usuário
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', data);
      
      // Salvar token e dados do usuário no AsyncStorage
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
      
      // Configura o token para futuras requisições
      api.defaults.headers.common['x-auth-token'] = response.data.token;
      
      return response.data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  },
  
  // Login
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', data);
      
      // Salvar token e dados do usuário no AsyncStorage
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
      
      // Configura o token para futuras requisições
      api.defaults.headers.common['x-auth-token'] = response.data.token;
      
      return response.data;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  },
  
  // Logout
  logout: async (): Promise<void> => {
    try {
      // Remover token e dados do AsyncStorage
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      
      // Remover token das requisições
      delete api.defaults.headers.common['x-auth-token'];
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  },
  
  // Verificar se o usuário está autenticado
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return !!token;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  },
  
  // Recuperar dados do usuário
  getUserData: async (): Promise<any> => {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao recuperar dados do usuário:', error);
      return null;
    }
  },
  
  // Inicializar o token para requisições após o app iniciar
  setupTokenFromStorage: async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        api.defaults.headers.common['x-auth-token'] = token;
      }
    } catch (error) {
      console.error('Erro ao configurar token:', error);
    }
  },
  
  // Solicitar recuperação de senha
  requestPasswordReset: async (data: ResetPasswordData): Promise<void> => {
    try {
      await api.post('/auth/forgot-password', data);
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      throw error;
    }
  },
  
  // Redefinir senha
  resetPassword: async (data: NewPasswordData): Promise<void> => {
    try {
      await api.post('/auth/reset-password', data);
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      throw error;
    }
  }
};

export default authService;