// src/types/index.ts

import { Theme } from '@react-navigation/native';
import { User } from './auth';
import { Budget } from './budget';
import { Goal } from './goal';
import { SyncStatusEnum } from './sync';
import { TransactionType, TransactionCategory, Transaction } from './transaction';

// Re-exportar todos os tipos de autenticação
export type {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse
} from './auth';

// Re-exportar todos os tipos de transação
export type {
  Transaction,
  TransactionType,
  TransactionCategory,
  CreateTransactionData,
  TransactionSummary
} from './transaction';

// Re-exportar todos os tipos de orçamento
export type {
  Budget,
  CreateBudgetData,
  BudgetProgress
} from './budget';

// Re-exportar todos os tipos de meta
export type {
  Goal,
  CreateGoalData,
  GoalProgress
} from './goal';

// Re-exportar todos os tipos de API
export type {
  ApiResponse,
  PaginatedResponse
} from './api';

// Re-exportar todos os tipos de navegação
export type {
  AuthStackParamList,
  MainStackParamList,
  RootStackParamList,
  AuthScreenProps,
  MainScreenProps
} from './navigation';

// Re-exportar todos os tipos de tema
export type {
  ThemeColors,
  Theme
} from './theme';

// Re-exportar todos os tipos de sincronização (com nomes corretos)
export type {
  SyncQueue,
  SyncState, // Era SyncStatus, agora é SyncState
  SyncStatusEnum // Importar o enum também
} from './sync';

// Tipos adicionais que podem ser úteis em vários lugares
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface FilterOptions {
  type?: TransactionType;
  category?: TransactionCategory;
  dateRange?: DateRange;
  minAmount?: number;
  maxAmount?: number;
}

export interface SortOptions {
  field: 'date' | 'amount' | 'description' | 'category';
  order: 'asc' | 'desc';
}

// Enum para prioridades
export enum Priority {
  LOW = 'baixa',
  MEDIUM = 'media',
  HIGH = 'alta'
}

// Interface para estatísticas do dashboard
export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  budgetUtilization: number;
  activeGoals: number;
  completedGoals: number;
}

// Interface para dados de gráficos
export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }[];
}

export interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

// Interface para configurações do usuário
export interface UserSettings {
  theme: 'light' | 'dark';
  currency: string;
  language: string;
  notifications: {
    budgetAlerts: boolean;
    goalReminders: boolean;
    weeklyReports: boolean;
  };
  privacy: {
    biometricLogin: boolean;
    autoLock: boolean;
    lockTimeout: number; // em minutos
  };
}

// Interface para backup/export
export interface BackupData {
  version: string;
  timestamp: number;
  user: User;
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  settings: UserSettings;
}

// Interface para notificações (futuro)
export interface Notification {
  id: string;
  type: 'budget_alert' | 'goal_reminder' | 'sync_error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionData?: any;
}

// Interface para validação de formulários
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// Utilitários de tipo
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Estados comuns para formulários
export interface FormState<T> {
  data: T;
  isLoading: boolean;
  errors: ValidationError[];
  isDirty: boolean;
  isValid: boolean;
}

// Interface para contexto de tema
export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Interface para contexto de sincronização (usando nomes corretos)
export interface SyncContextType {
  syncStatus: SyncStatusEnum; // Usar o enum aqui
  lastSyncTime: number | null;
  pendingOperations: number;
  forcSync: () => Promise<void>;
  isOnline: boolean;
}

// Tipos para hooks personalizados
export interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseFormResult<T> {
  values: T;
  errors: ValidationError[];
  isValid: boolean;
  isDirty: boolean;
  setValue: (field: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  validate: () => boolean;
  reset: () => void;
  handleSubmit: (onSubmit: (values: T) => void) => (e?: any) => void;
}

// Constantes de tipo
export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export const TRANSACTION_CATEGORIES = [
  'alimentacao', 'transporte', 'moradia', 'saude', 'educacao',
  'lazer', 'vestuario', 'servicos', 'investimentos', 'salario',
  'freelance', 'vendas', 'outros'
] as const;

export const GOAL_CATEGORIES = [
  'emergencia', 'viagem', 'casa', 'carro', 'educacao',
  'investimento', 'aposentadoria', 'outros'
] as const;

export const THEMES = ['light', 'dark'] as const;
export const CURRENCIES = ['BRL', 'USD', 'EUR'] as const;
export const LANGUAGES = ['pt-BR', 'en-US'] as const;

// Alias para facilitar o uso
export { SyncStatusEnum as SyncStatus }; // Para manter compatibilidade