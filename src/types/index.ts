export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  _id?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: string;
  recurringParentId?: string; // Para identificar transações geradas automaticamente
}

export interface Goal {
  _id?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyTarget: number;
}

export interface AuthData {
  token: string;
  user: User;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface NavigationProp {
  navigate: (screen: string) => void;
}