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
}

export interface Category {
  _id?: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
  createdAt?: Date | string;
  updatedAt?: Date | string;
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