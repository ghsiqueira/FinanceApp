// src/types/index.ts - Versão atualizada com novos tipos

export interface Transaction {
  _id?: string;
  amount: number;
  type: 'income' | 'expense';
  category: Category | string;
  description?: string;
  date: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  user?: string; // ID do usuário proprietário da transação
  tags?: string[]; // Tags para melhor organização
  location?: string; // Localização da transação (opcional)
  receipt?: string; // Caminho para foto do recibo (opcional)
  recurring?: boolean; // Se é uma transação recorrente
  recurringId?: string; // ID da transação recorrente pai
}

export interface Category {
  _id?: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  user?: string; // ID do usuário proprietário da categoria
  description?: string; // Descrição da categoria
  budgetLimit?: number; // Limite de orçamento para a categoria
  isActive?: boolean; // Se a categoria está ativa
}

export interface Goal {
  _id?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date | string;
  category?: Category | string;
  color: string;
  isCompleted: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  user?: string;
  // Campos de planejamento
  priority: number; // 1-5 (1: Muito alta, 5: Muito baixa)
  monthlyContribution: number; // Valor de contribuição mensal sugerido
  autoRedistribute: boolean; // Redistribuir automaticamente quando concluído
  // Novos campos
  description?: string; // Descrição da meta
  milestones?: GoalMilestone[]; // Marcos intermediários
  tags?: string[]; // Tags para organização
  imageUrl?: string; // Imagem associada à meta
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetAmount: number;
  isCompleted: boolean;
  completedAt?: Date | string;
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
  transactions: Transaction[];
  categoryBreakdown?: CategorySummary[];
  comparisonToPrevious?: {
    incomeChange: number;
    expenseChange: number;
    balanceChange: number;
  };
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: Date | string;
  preferences?: UserPreferences;
  profilePicture?: string;
}

export interface UserPreferences {
  currency: string;
  language: string;
  timezone: string;
  notificationsEnabled: boolean;
  autoBackup: boolean;
  budgetAlerts: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface RecurringTransaction {
  _id?: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string | Category;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string; // ISO string
  endDate?: string; // ISO string, optional
  dayOfWeek?: number; // 0-6 for weekly frequency
  dayOfMonth?: number; // 1-31 for monthly and yearly frequency
  month?: number; // 0-11 for yearly frequency
  autoGenerate: boolean;
  requireConfirmation: boolean;
  active: boolean;
  user?: string;
  lastProcessed?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface FinancialPlan {
  monthlyIncome: number; // Renda mensal
  savingsPercentage: number; // Porcentagem da renda destinada a poupança/metas
  autoDistribute: boolean; // Distribuir automaticamente entre as metas
  emergencyFundTarget?: number; // Meta para fundo de emergência
  retirementContribution?: number; // Contribuição para aposentadoria
}

// Tipos para o sistema de orçamento
export interface Budget {
  _id?: string;
  name: string;
  month: number;
  year: number;
  totalAmount: number;
  categories: BudgetCategory[];
  user?: string;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface BudgetCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  status: 'under' | 'near' | 'over';
}

// Tipos para insights e análises
export interface FinancialInsight {
  id: string;
  type: 'spending_pattern' | 'saving_opportunity' | 'budget_warning' | 'goal_suggestion' | 'trend_analysis';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category?: string;
  actionable: boolean;
  suggestions: string[];
  data?: any;
  createdAt: Date;
  isRead: boolean;
}

// Tipos para notificações
export interface AppNotification {
  id: string;
  type: 'reminder' | 'alert' | 'achievement' | 'tip';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  scheduledFor?: Date;
  data?: any;
}

// Tipos para relatórios
export interface ReportData {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    savingsRate: number;
  };
  categoryBreakdown: CategorySummary[];
  monthlyTrends: MonthlyData[];
  insights: FinancialInsight[];
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
}

// Tipos para backup
export interface BackupData {
  version: string;
  timestamp: string;
  user: {
    id: string;
    email: string;
  };
  data: {
    transactions: Transaction[];
    categories: Category[];
    goals: Goal[];
    recurringTransactions?: RecurringTransaction[];
    budgets?: Budget[];
    settings: any;
  };
}

// Tipos para configurações
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  currency: string;
  language: string;
  hideValues: boolean;
  notificationsEnabled: boolean;
  autoBackup: boolean;
  budgetAlerts: boolean;
  biometricAuth: boolean;
  exportFormat: 'csv' | 'pdf' | 'xlsx';
}

// Tipos para filtros e pesquisa
export interface TransactionFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  types?: ('income' | 'expense')[];
  amountRange?: {
    min: number;
    max: number;
  };
  searchText?: string;
  tags?: string[];
}

export interface GoalFilters {
  status?: ('completed' | 'in_progress' | 'overdue')[];
  categories?: string[];
  priorities?: number[];
  deadlineRange?: {
    start: Date;
    end: Date;
  };
}

// Tipos para análise avançada
export interface SpendingTrend {
  categoryId: string;
  categoryName: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  changePercentage: number;
  monthlyAverage: number;
  predictedNextMonth: number;
}

export interface SavingsAnalysis {
  monthlyIncomeAverage: number;
  monthlyExpenseAverage: number;
  averageSavingsRate: number;
  recommendedSavingsRate: number;
  potentialMonthlySavings: number;
  topSpendingCategories: CategorySummary[];
}

// Tipos para metas inteligentes
export interface SmartGoalSuggestion {
  title: string;
  description: string;
  suggestedAmount: number;
  suggestedDeadline: Date;
  category?: string;
  reasoning: string[];
  priority: number;
}

// Export de tipos auxiliares para o React Navigation
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Transactions: undefined;
  Budget: undefined;
  Goals: undefined;
  Reports: undefined;
  Settings: undefined;
};

// Enums para melhor type safety
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
  BOTH = 'both'
}

export enum GoalPriority {
  VERY_HIGH = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
  VERY_LOW = 5
}

export enum NotificationType {
  REMINDER = 'reminder',
  ALERT = 'alert',
  ACHIEVEMENT = 'achievement',
  TIP = 'tip'
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}