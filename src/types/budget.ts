// src/types/budget.ts
export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  month: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  percentage: number;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
  projectedTotal: number; // Adicionar este campo
}

export interface CreateBudgetData {
  category: string;
  amount: number;
  month: string;
  description?: string;
}