// src/context/CategoryContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Category } from '../types';
import categoryService from '../services/categoryService';

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
}

const CategoryContext = createContext<CategoryContextData>({} as CategoryContextData);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar categorias por tipo
  const incomeCategories = categories.filter(
    (category) => category.type === 'income' || category.type === 'both'
  );

  const expenseCategories = categories.filter(
    (category) => category.type === 'expense' || category.type === 'both'
  );

  // Buscar todas as categorias
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      setError('Erro ao buscar categorias. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova categoria
  const addCategory = async (category: Category): Promise<Category> => {
    setLoading(true);
    setError(null);
    try {
      const newCategory = await categoryService.create(category);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      setError('Erro ao adicionar categoria. Tente novamente.');
      console.error(err);
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
      const updatedCategory = await categoryService.update(id, category);
      setCategories(prev => 
        prev.map(c => c._id === id ? updatedCategory : c)
      );
      return updatedCategory;
    } catch (err) {
      setError('Erro ao atualizar categoria. Tente novamente.');
      console.error(err);
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
    } catch (err) {
      setError('Erro ao excluir categoria. Tente novamente.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Carregar categorias ao iniciar
  useEffect(() => {
    fetchCategories();
  }, []);

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
      deleteCategory
    }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => useContext(CategoryContext);