// src/services/authService.ts - Enhanced version
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sanitizeObject } from '../utils/sanitize';

const AUTH_TOKEN_KEY = '@FinanceApp:authToken';
const USER_DATA_KEY = '@FinanceApp:userData';
const TOKEN_EXPIRY_KEY = '@FinanceApp:tokenExpiry';

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
      // Sanitize input data
      const sanitizedData = sanitizeObject(data);
      
      const response = await api.post('/auth/register', sanitizedData);
      
      // Set token expiry (7 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      // Salvar token, expiração e dados do usuário no AsyncStorage
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString());
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
      // Sanitize input data
      const sanitizedData = sanitizeObject(data);
      
      const response = await api.post('/auth/login', sanitizedData);
      
      // Set token expiry (7 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      
      // Salvar token, expiração e dados do usuário no AsyncStorage
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString());
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
      await AsyncStorage.removeItem(TOKEN_EXPIRY_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
      
      // Remover token das requisições
      delete api.defaults.headers.common['x-auth-token'];
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  },
  
  // Verificar se o usuário está autenticado e se o token não expirou
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const expiryDateStr = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
      
      if (!token || !expiryDateStr) {
        return false;
      }
      
      // Check if token is expired
      const expiryDate = new Date(expiryDateStr);
      const now = new Date();
      
      if (now > expiryDate) {
        // Token expired, logout
        await authService.logout();
        return false;
      }
      
      return true;
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
      // Check if token is valid and not expired
      const isValid = await authService.isAuthenticated();
      
      if (isValid) {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          api.defaults.headers.common['x-auth-token'] = token;
        }
      }
    } catch (error) {
      console.error('Erro ao configurar token:', error);
    }
  },
  
  // Solicitar recuperação de senha
  requestPasswordReset: async (data: ResetPasswordData): Promise<void> => {
    try {
      // Sanitize input data
      const sanitizedData = sanitizeObject(data);
      
      await api.post('/auth/forgot-password', sanitizedData);
    } catch (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
      throw error;
    }
  },
  
  // Redefinir senha
  resetPassword: async (data: NewPasswordData): Promise<void> => {
    try {
      // Sanitize input data
      const sanitizedData = sanitizeObject(data);
      
      await api.post('/auth/reset-password', sanitizedData);
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      throw error;
    }
  }
};

export default authService;