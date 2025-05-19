// src/services/categoryService.ts
import api from './api';
import { Category } from '../types';

const categoryService = {
  // Obter todas as categorias
  getAll: async (): Promise<Category[]> => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  },
  
  // Obter uma categoria específica
  getById: async (id: string): Promise<Category> => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar categoria ${id}:`, error);
      throw error;
    }
  },
  
  // Criar nova categoria
  create: async (category: Category): Promise<Category> => {
    try {
      const response = await api.post('/categories', category);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  },
  
  // Atualizar categoria existente
  update: async (id: string, category: Category): Promise<Category> => {
    try {
      const response = await api.put(`/categories/${id}`, category);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar categoria ${id}:`, error);
      throw error;
    }
  },
  
  // Excluir categoria
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/categories/${id}`);
    } catch (error) {
      console.error(`Erro ao excluir categoria ${id}:`, error);
      throw error;
    }
  }
};

export default categoryService;