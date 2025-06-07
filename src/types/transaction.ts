export type TransactionType = 'income' | 'expense';

export type TransactionCategory = 
  | 'alimentacao'
  | 'transporte'
  | 'moradia'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'vestuario'
  | 'servicos'
  | 'investimentos'
  | 'salario'
  | 'freelance'
  | 'vendas'
  | 'outros';

export interface Transaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: TransactionCategory;
  date: string;
  isOnline: boolean;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionData {
  type: TransactionType;
  amount: number;
  description: string;
  category: TransactionCategory;
  date?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}
