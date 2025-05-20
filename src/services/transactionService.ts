// src/services/transactionService.ts - Fixed version
import api from './api';
import { Transaction, MonthlySummary } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_DATA_KEY = '@FinanceApp:userData';

const transactionService = {
  // Obter todas as transações
  getAll: async (): Promise<Transaction[]> => {
    try {
      const response = await api.get('/transactions');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  },
  
  // Obter uma transação específica
  getById: async (id: string): Promise<Transaction> => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar transação ${id}:`, error);
      throw error;
    }
  },
  
  // Criar nova transação
  create: async (transaction: Transaction): Promise<Transaction> => {
    try {
      // Get user data from AsyncStorage
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      let userId = null;
      
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id;
      }
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      // Add user ID to transaction data
      const transactionWithUser = {
        ...transaction,
        user: userId
      };
      
      console.log('Creating transaction with data:', transactionWithUser);
      const response = await api.post('/transactions', transactionWithUser);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  },
  
  // Atualizar transação existente
  update: async (id: string, transaction: Transaction): Promise<Transaction> => {
    try {
      // Get user data from AsyncStorage
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      let userId = null;
      
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id;
      }
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      // Add user ID to transaction data
      const transactionWithUser = {
        ...transaction,
        user: userId
      };
      
      const response = await api.put(`/transactions/${id}`, transactionWithUser);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar transação ${id}:`, error);
      throw error;
    }
  },
  
  // Excluir transação
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/transactions/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir transação ${id}:`, error);
      throw error;
    }
  },
  
  // Obter resumo mensal
  getMonthlySummary: async (year: number, month: number): Promise<MonthlySummary> => {
    try {
      const response = await api.get('/transactions/summary/monthly', {
        params: { year, month }
      });
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar resumo mensal de ${month}/${year}:`, error);
      throw error;
    }
  }
};

export default transactionService;