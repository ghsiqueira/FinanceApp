// src/context/GoalContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Goal } from '../types';
import goalService from '../services/goalService';

interface GoalContextData {
  goals: Goal[];
  completedGoals: Goal[];
  inProgressGoals: Goal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  addGoal: (goal: Goal) => Promise<Goal>;
  updateGoal: (id: string, goal: Goal) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  addAmountToGoal: (id: string, amount: number) => Promise<Goal>;
}

const GoalContext = createContext<GoalContextData>({} as GoalContextData);

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar metas por status
  const completedGoals = goals.filter(goal => goal.isCompleted);
  const inProgressGoals = goals.filter(goal => !goal.isCompleted);

  // Buscar todas as metas
  const fetchGoals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await goalService.getAll();
      setGoals(data);
    } catch (err) {
      setError('Erro ao buscar metas. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova meta
  const addGoal = async (goal: Goal): Promise<Goal> => {
    setLoading(true);
    setError(null);
    try {
      const newGoal = await goalService.create(goal);
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    } catch (err) {
      setError('Erro ao adicionar meta. Tente novamente.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar meta existente
  const updateGoal = async (id: string, goal: Goal): Promise<Goal> => {
    setLoading(true);
    setError(null);
    try {
      const updatedGoal = await goalService.update(id, goal);
      setGoals(prev => 
        prev.map(g => g._id === id ? updatedGoal : g)
      );
      return updatedGoal;
    } catch (err) {
      setError('Erro ao atualizar meta. Tente novamente.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir meta
  const deleteGoal = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await goalService.delete(id);
      setGoals(prev => prev.filter(g => g._id !== id));
    } catch (err) {
      setError('Erro ao excluir meta. Tente novamente.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Adicionar valor à meta
  const addAmountToGoal = async (id: string, amount: number): Promise<Goal> => {
    setLoading(true);
    setError(null);
    try {
      const updatedGoal = await goalService.addAmount(id, amount);
      setGoals(prev => 
        prev.map(g => g._id === id ? updatedGoal : g)
      );
      return updatedGoal;
    } catch (err) {
      setError('Erro ao adicionar valor à meta. Tente novamente.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Carregar metas ao iniciar
  useEffect(() => {
    fetchGoals();
  }, []);

  return (
    <GoalContext.Provider value={{
      goals,
      completedGoals,
      inProgressGoals,
      loading,
      error,
      fetchGoals,
      addGoal,
      updateGoal,
      deleteGoal,
      addAmountToGoal
    }}>
      {children}
    </GoalContext.Provider>
  );
};

export const useGoals = () => useContext(GoalContext);