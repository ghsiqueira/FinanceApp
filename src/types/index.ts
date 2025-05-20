// src/types/index.ts

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
  user?: string; // ID do usuário proprietário da meta
}

export interface MonthlySummary {
  income: number;
  expense: number;
  balance: number;
  transactions: Transaction[];
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  // Adicione outras propriedades do usuário conforme necessário
}