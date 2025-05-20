// src/services/goalService.ts - Fixed version
import api from './api';
import { Goal } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_DATA_KEY = '@FinanceApp:userData';

const goalService = {
  // Obter todas as metas
  getAll: async (): Promise<Goal[]> => {
    try {
      const response = await api.get('/goals');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      throw error;
    }
  },
  
  // Obter uma meta específica
  getById: async (id: string): Promise<Goal> => {
    try {
      const response = await api.get(`/goals/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar meta ${id}:`, error);
      throw error;
    }
  },
  
  // Criar nova meta
  create: async (goal: Goal): Promise<Goal> => {
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
      
      // Add user ID to goal data
      const goalWithUser = {
        ...goal,
        user: userId
      };
      
      console.log('Creating goal with data:', goalWithUser);
      const response = await api.post('/goals', goalWithUser);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      throw error;
    }
  },
  
  // Atualizar meta existente
  update: async (id: string, goal: Goal): Promise<Goal> => {
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
      
      // Add user ID to goal data
      const goalWithUser = {
        ...goal,
        user: userId
      };
      
      const response = await api.put(`/goals/${id}`, goalWithUser);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar meta ${id}:`, error);
      throw error;
    }
  },
  
  // Excluir meta
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/goals/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir meta ${id}:`, error);
      throw error;
    }
  },
  
  // Adicionar valor a uma meta
  addAmount: async (id: string, amount: number): Promise<Goal> => {
    try {
      const response = await api.post(`/goals/${id}/add`, { amount });
      return response.data;
    } catch (error) {
      console.error(`Erro ao adicionar valor à meta ${id}:`, error);
      throw error;
    }
  }
};

export default goalService;