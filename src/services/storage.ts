// src/services/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Budget, Goal, SyncQueue, User } from '../types';

const STORAGE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  TRANSACTIONS: 'transactions',
  BUDGETS: 'budgets',
  GOALS: 'goals',
  SYNC_QUEUE: 'sync_queue',
  LAST_SYNC: 'last_sync',
  OFFLINE_MODE: 'offline_mode',
} as const;

class StorageService {
  // Métodos gerais
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Erro ao salvar ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Erro ao ler ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Erro ao remover ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
      throw error;
    }
  }

  // Auth
  async saveAuth(user: User, token: string): Promise<void> {
    await Promise.all([
      this.setItem(STORAGE_KEYS.USER, user),
      this.setItem(STORAGE_KEYS.TOKEN, token),
    ]);
  }

  async getAuth(): Promise<{ user: User; token: string } | null> {
    try {
      const [user, token] = await Promise.all([
        this.getItem<User>(STORAGE_KEYS.USER),
        this.getItem<string>(STORAGE_KEYS.TOKEN),
      ]);

      if (user && token) {
        return { user, token };
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter auth:', error);
      return null;
    }
  }

  async clearAuth(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.USER),
      this.removeItem(STORAGE_KEYS.TOKEN),
    ]);
  }

  // Transactions
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
  }

  async getTransactions(): Promise<Transaction[]> {
    const transactions = await this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS);
    return transactions || [];
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    const transactions = await this.getTransactions();
    const updatedTransactions = [transaction, ...transactions];
    await this.saveTransactions(updatedTransactions);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const transactions = await this.getTransactions();
    const updatedTransactions = transactions.map(t => 
      t._id === id ? { ...t, ...updates } : t
    );
    await this.saveTransactions(updatedTransactions);
  }

  async deleteTransaction(id: string): Promise<void> {
    const transactions = await this.getTransactions();
    const updatedTransactions = transactions.filter(t => t._id !== id);
    await this.saveTransactions(updatedTransactions);
  }

  // Budgets
  async saveBudgets(budgets: Budget[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.BUDGETS, budgets);
  }

  async getBudgets(): Promise<Budget[]> {
    const budgets = await this.getItem<Budget[]>(STORAGE_KEYS.BUDGETS);
    return budgets || [];
  }

  async addBudget(budget: Budget): Promise<void> {
    const budgets = await this.getBudgets();
    const updatedBudgets = [budget, ...budgets];
    await this.saveBudgets(updatedBudgets);
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<void> {
    const budgets = await this.getBudgets();
    const updatedBudgets = budgets.map(b => 
      b._id === id ? { ...b, ...updates } : b
    );
    await this.saveBudgets(updatedBudgets);
  }

  async deleteBudget(id: string): Promise<void> {
    const budgets = await this.getBudgets();
    const updatedBudgets = budgets.filter(b => b._id !== id);
    await this.saveBudgets(updatedBudgets);
  }

  // Goals
  async saveGoals(goals: Goal[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.GOALS, goals);
  }

  async getGoals(): Promise<Goal[]> {
    const goals = await this.getItem<Goal[]>(STORAGE_KEYS.GOALS);
    return goals || [];
  }

  async addGoal(goal: Goal): Promise<void> {
    const goals = await this.getGoals();
    const updatedGoals = [goal, ...goals];
    await this.saveGoals(updatedGoals);
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
    const goals = await this.getGoals();
    const updatedGoals = goals.map(g => 
      g._id === id ? { ...g, ...updates } : g
    );
    await this.saveGoals(updatedGoals);
  }

  async deleteGoal(id: string): Promise<void> {
    const goals = await this.getGoals();
    const updatedGoals = goals.filter(g => g._id !== id);
    await this.saveGoals(updatedGoals);
  }

  // Sync Queue
  async getSyncQueue(): Promise<SyncQueue[]> {
    const queue = await this.getItem<SyncQueue[]>(STORAGE_KEYS.SYNC_QUEUE);
    return queue || [];
  }

  async addToSyncQueue(operation: Omit<SyncQueue, 'id' | 'timestamp' | 'attempts'>): Promise<void> {
    const queue = await this.getSyncQueue();
    const newOperation: SyncQueue = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      attempts: 0,
    };
    
    const updatedQueue = [...queue, newOperation];
    await this.setItem(STORAGE_KEYS.SYNC_QUEUE, updatedQueue);
  }

  async updateSyncQueue(operations: SyncQueue[]): Promise<void> {
    await this.setItem(STORAGE_KEYS.SYNC_QUEUE, operations);
  }

  async clearSyncQueue(): Promise<void> {
    await this.setItem(STORAGE_KEYS.SYNC_QUEUE, []);
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const queue = await this.getSyncQueue();
    const updatedQueue = queue.filter(op => op.id !== id);
    await this.updateSyncQueue(updatedQueue);
  }

  // Last sync
  async setLastSync(timestamp: number): Promise<void> {
    await this.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  }

  async getLastSync(): Promise<number | null> {
    return await this.getItem<number>(STORAGE_KEYS.LAST_SYNC);
  }

  // Offline mode
  async setOfflineMode(isOffline: boolean): Promise<void> {
    await this.setItem(STORAGE_KEYS.OFFLINE_MODE, isOffline);
  }

  async getOfflineMode(): Promise<boolean> {
    const isOffline = await this.getItem<boolean>(STORAGE_KEYS.OFFLINE_MODE);
    return isOffline || false;
  }

  // Utility methods
  async generateOfflineId(): Promise<string> {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async isOfflineId(id: string): Promise<boolean> {
    return id.startsWith('offline_');
  }

  // Backup e restore
  async createBackup(): Promise<string> {
    try {
      const [transactions, budgets, goals] = await Promise.all([
        this.getTransactions(),
        this.getBudgets(),
        this.getGoals(),
      ]);

      const backup = {
        version: '1.0',
        timestamp: Date.now(),
        data: {
          transactions,
          budgets,
          goals,
        },
      };

      return JSON.stringify(backup);
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      throw error;
    }
  }

  async restoreBackup(backupData: string): Promise<void> {
    try {
      const backup = JSON.parse(backupData);
      
      if (backup.version !== '1.0') {
        throw new Error('Versão do backup não suportada');
      }

      const { transactions, budgets, goals } = backup.data;

      await Promise.all([
        this.saveTransactions(transactions || []),
        this.saveBudgets(budgets || []),
        this.saveGoals(goals || []),
      ]);
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
export default storageService;