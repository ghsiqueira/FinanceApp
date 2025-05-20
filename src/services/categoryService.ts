// src/services/categoryService.ts - Versão corrigida
import api from './api';
import { Category } from '../types';

const categoryService = {
  // Obter todas as categorias
  getAll: async (): Promise<Category[]> => {
    try {
      console.log("Calling categories API endpoint...");
      const response = await api.get('/categories');
      console.log(`API returned ${response.data.length} categories`);
      return response.data;
    } catch (error: any) { // Tipando o erro como any para acessar propriedades
      console.error('Erro ao buscar categorias:', error);
      // Check for specific error types
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response:", error.response.data);
        console.error("Status:", error.response.status);
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up request:", error.message);
      }
      throw error;
    }
  },
  
  // Obter uma categoria específica
  getById: async (id: string): Promise<Category> => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao buscar categoria ${id}:`, error);
      throw error;
    }
  },
  
  // Criar nova categoria
  create: async (category: Category): Promise<Category> => {
    try {
      console.log("Creating category:", category);
      const response = await api.post('/categories', category);
      console.log("Created category:", response.data);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      // Check for specific error types
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Status:", error.response.status);
      }
      throw error;
    }
  },
  
  // Atualizar categoria existente
  update: async (id: string, category: Category): Promise<Category> => {
    try {
      const response = await api.put(`/categories/${id}`, category);
      return response.data;
    } catch (error: any) {
      console.error(`Erro ao atualizar categoria ${id}:`, error);
      throw error;
    }
  },
  
  // Excluir categoria
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/categories/${id}`);
    } catch (error: any) {
      console.error(`Erro ao excluir categoria ${id}:`, error);
      throw error;
    }
  }
};

export default categoryService;