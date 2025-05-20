// src/context/CategoryContext.tsx - Versão corrigida para o erro de tipagem
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Category, User } from '../types';
import categoryService from '../services/categoryService';
import { useAuth } from './AuthContext';
import { DEFAULT_CATEGORIES } from '../constants';

interface CategoryContextData {
  categories: Category[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (category: Category) => Promise<Category>;
  updateCategory: (id: string, category: Category) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  initializeDefaultCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextData>({} as CategoryContextData);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Filtrar categorias por tipo
  const incomeCategories = categories.filter(
    (category) => category.type === 'income' || category.type === 'both'
  );

  const expenseCategories = categories.filter(
    (category) => category.type === 'expense' || category.type === 'both'
  );

  // Initialize default categories for a new user
  const initializeDefaultCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) {
        console.log("No user found, cannot initialize categories");
        return;
      }
      
      // Check if categories already exist
      const existingCategories = await categoryService.getAll();
      
      // If user already has categories, don't create defaults
      if (existingCategories.length > 0) {
        console.log("User already has categories, skipping default creation");
        setCategories(existingCategories);
        return;
      }
      
      console.log("Creating default categories for user");
      
      // Create default categories
      const categoryPromises = DEFAULT_CATEGORIES.map(defaultCategory => 
        categoryService.create({
          ...defaultCategory,
          user: user.id
        } as Category)  // Usamos type assertion para garantir que o objeto seja do tipo Category
      );
      
      const createdCategories = await Promise.all(categoryPromises);
      setCategories(createdCategories);
      console.log(`Created ${createdCategories.length} default categories`);
      
    } catch (err: any) {
      console.error("Error initializing default categories:", err);
      setError('Error initializing default categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar todas as categorias
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching categories...");
      const data = await categoryService.getAll();
      console.log(`Fetched ${data.length} categories`);
      setCategories(data);
      
      // If no categories were found and we have a user, initialize defaults
      if (data.length === 0 && user) {
        console.log("No categories found, initializing defaults");
        await initializeDefaultCategories();
      }
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError('Erro ao buscar categorias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova categoria
  const addCategory = async (category: Category): Promise<Category> => {
    setLoading(true);
    setError(null);
    try {
      // Ensure user ID is included
      const categoryWithUser = {
        ...category,
        user: user?.id
      };
      
      const newCategory = await categoryService.create(categoryWithUser);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err: any) {
      console.error("Error adding category:", err);
      setError('Erro ao adicionar categoria. Tente novamente.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar categoria existente
  const updateCategory = async (id: string, category: Category): Promise<Category> => {
    setLoading(true);
    setError(null);
    try {
      // Ensure user ID is included
      const categoryWithUser = {
        ...category,
        user: user?.id
      };
      
      const updatedCategory = await categoryService.update(id, categoryWithUser);
      setCategories(prev => 
        prev.map(c => c._id === id ? updatedCategory : c)
      );
      return updatedCategory;
    } catch (err: any) {
      console.error("Error updating category:", err);
      setError('Erro ao atualizar categoria. Tente novamente.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir categoria
  const deleteCategory = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await categoryService.delete(id);
      setCategories(prev => prev.filter(c => c._id !== id));
    } catch (err: any) {
      console.error("Error deleting category:", err);
      setError('Erro ao excluir categoria. Tente novamente.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load categories when user changes
  useEffect(() => {
    if (user) {
      fetchCategories();
    } else {
      // Clear categories when user logs out
      setCategories([]);
    }
  }, [user]);

  return (
    <CategoryContext.Provider value={{
      categories,
      incomeCategories,
      expenseCategories,
      loading,
      error,
      fetchCategories,
      addCategory,
      updateCategory,
      deleteCategory,
      initializeDefaultCategories
    }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => useContext(CategoryContext);