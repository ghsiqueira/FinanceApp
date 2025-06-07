// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { 
  ApiResponse, 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse,
  Transaction,
  CreateTransactionData,
  Budget,
  CreateBudgetData,
  Goal,
  CreateGoalData,
  User,
  BudgetProgress
} from '../types';

class ApiService {
  private client: AxiosInstance;
  private baseURL = __DEV__ 
    ? 'http://localhost:3000/api' 
    : 'https://your-api-url.com/api';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - adicionar token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - tratar erros
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado - limpar dados locais
          await AsyncStorage.multiRemove(['token', 'user']);
          // Redirecionar para login seria tratado no Redux
        }
        return Promise.reject(error);
      }
    );
  }

  // Verificar conectividade
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  // Auth endpoints
  auth = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response: AxiosResponse<AuthResponse> = await this.client.post(
        '/auth/login', 
        credentials
      );
      return response.data;
    },

    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
      const response: AxiosResponse<AuthResponse> = await this.client.post(
        '/auth/register', 
        credentials
      );
      return response.data;
    },

    forgotPassword: async (email: string): Promise<ApiResponse> => {
      const response: AxiosResponse<ApiResponse> = await this.client.post(
        '/auth/forgot-password',
        { email }
      );
      return response.data;
    },

    resetPassword: async (token: string, password: string): Promise<AuthResponse> => {
      const response: AxiosResponse<AuthResponse> = await this.client.post(
        '/auth/reset-password',
        { token, password }
      );
      return response.data;
    },

    verifyToken: async (): Promise<ApiResponse<{ user: User }>> => {
      const response: AxiosResponse<ApiResponse<{ user: User }>> = 
        await this.client.get('/auth/verify');
      return response.data;
    },
  };

  // Transaction endpoints
  transactions = {
    getAll: async (page = 1, limit = 20): Promise<ApiResponse<Transaction[]>> => {
      const response: AxiosResponse<ApiResponse<Transaction[]>> = 
        await this.client.get(`/transactions?page=${page}&limit=${limit}`);
      return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<Transaction>> => {
      const response: AxiosResponse<ApiResponse<Transaction>> = 
        await this.client.get(`/transactions/${id}`);
      return response.data;
    },

    create: async (data: CreateTransactionData): Promise<ApiResponse<Transaction>> => {
      const response: AxiosResponse<ApiResponse<Transaction>> = 
        await this.client.post('/transactions', data);
      return response.data;
    },

    update: async (id: string, data: Partial<CreateTransactionData>): Promise<ApiResponse<Transaction>> => {
      const response: AxiosResponse<ApiResponse<Transaction>> = 
        await this.client.put(`/transactions/${id}`, data);
      return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
      const response: AxiosResponse<ApiResponse> = 
        await this.client.delete(`/transactions/${id}`);
      return response.data;
    },

    getSummary: async (startDate?: string, endDate?: string): Promise<ApiResponse> => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response: AxiosResponse<ApiResponse> = 
        await this.client.get(`/transactions/summary?${params}`);
      return response.data;
    },
  };

  // Budget endpoints
  budgets = {
    getAll: async (month?: string): Promise<ApiResponse<Budget[]>> => {
      const params = month ? `?month=${month}` : '';
      const response: AxiosResponse<ApiResponse<Budget[]>> = 
        await this.client.get(`/budgets${params}`);
      return response.data;
    },

    create: async (data: CreateBudgetData): Promise<ApiResponse<Budget>> => {
      const response: AxiosResponse<ApiResponse<Budget>> = 
        await this.client.post('/budgets', data);
      return response.data;
    },

    update: async (id: string, data: Partial<CreateBudgetData>): Promise<ApiResponse<Budget>> => {
      const response: AxiosResponse<ApiResponse<Budget>> = 
        await this.client.put(`/budgets/${id}`, data);
      return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
      const response: AxiosResponse<ApiResponse> = 
        await this.client.delete(`/budgets/${id}`);
      return response.data;
    },

    getProgress: async (month: string): Promise<ApiResponse<Record<string, BudgetProgress>>> => {
      const response: AxiosResponse<ApiResponse<Record<string, BudgetProgress>>> = 
        await this.client.get(`/budgets/progress?month=${month}`);
      return response.data;
    },
  };

  // Goal endpoints
  goals = {
    getAll: async (): Promise<ApiResponse<Goal[]>> => {
      const response: AxiosResponse<ApiResponse<Goal[]>> = 
        await this.client.get('/goals');
      return response.data;
    },

    create: async (data: CreateGoalData): Promise<ApiResponse<Goal>> => {
      const response: AxiosResponse<ApiResponse<Goal>> = 
        await this.client.post('/goals', data);
      return response.data;
    },

    update: async (id: string, data: Partial<CreateGoalData>): Promise<ApiResponse<Goal>> => {
      const response: AxiosResponse<ApiResponse<Goal>> = 
        await this.client.put(`/goals/${id}`, data);
      return response.data;
    },

    delete: async (id: string): Promise<ApiResponse> => {
      const response: AxiosResponse<ApiResponse> = 
        await this.client.delete(`/goals/${id}`);
      return response.data;
    },

    addProgress: async (id: string, amount: number): Promise<ApiResponse<Goal>> => {
      const response: AxiosResponse<ApiResponse<Goal>> = 
        await this.client.post(`/goals/${id}/progress`, { amount });
      return response.data;
    },
  };

  // User endpoints
  user = {
    getProfile: async (): Promise<ApiResponse<User>> => {
      const response: AxiosResponse<ApiResponse<User>> = 
        await this.client.get('/users/profile');
      return response.data;
    },

    updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
      const response: AxiosResponse<ApiResponse<User>> = 
        await this.client.put('/users/profile', data);
      return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
      const response: AxiosResponse<ApiResponse> = 
        await this.client.put('/users/change-password', {
          currentPassword,
          newPassword
        });
      return response.data;
    },

    updateTheme: async (theme: 'light' | 'dark'): Promise<ApiResponse<User>> => {
      const response: AxiosResponse<ApiResponse<User>> = 
        await this.client.put('/users/theme', { theme });
      return response.data;
    },
  };
}

// Instância do serviço
export const apiService = new ApiService();

// Funções exportadas para os slices
export const getGoals = () => apiService.goals.getAll();
export const createGoal = (goalData: CreateGoalData) => apiService.goals.create(goalData);
export const updateGoal = (id: string, data: Partial<Goal>) => apiService.goals.update(id, data);
export const deleteGoal = (id: string) => apiService.goals.delete(id);
export const addGoalContribution = (goalId: string, amount: number) => apiService.goals.addProgress(goalId, amount);

export const getBudgets = (month?: string) => apiService.budgets.getAll(month);
export const createBudget = (budgetData: CreateBudgetData) => apiService.budgets.create(budgetData);
export const updateBudget = (id: string, data: Partial<Budget>) => apiService.budgets.update(id, data);
export const deleteBudget = (id: string) => apiService.budgets.delete(id);
export const getBudgetProgress = (month: string) => apiService.budgets.getProgress(month);

export default apiService;