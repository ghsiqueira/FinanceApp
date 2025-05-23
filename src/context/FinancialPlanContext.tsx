// src/context/FinancialPlanContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FinancialPlan } from '../types';
import { calculateMonthlyContributions, redistributeCompletedGoals } from '../utils/goalPlanner';
import { useGoals } from './GoalContext';

// Chave de armazenamento
const FINANCIAL_PLAN_KEY = '@FinanceApp:financialPlan';

// Plano financeiro padrão
const DEFAULT_FINANCIAL_PLAN: FinancialPlan = {
  monthlyIncome: 0,
  savingsPercentage: 20, // 20% como padrão
  autoDistribute: true
};

// Interface do contexto
interface FinancialPlanContextData {
  financialPlan: FinancialPlan;
  loading: boolean;
  updateFinancialPlan: (plan: Partial<FinancialPlan>) => Promise<void>;
  recalculateGoalContributions: () => Promise<void>;
  handleGoalCompletion: (goalId: string) => Promise<void>;
}

// Criar o contexto
const FinancialPlanContext = createContext<FinancialPlanContextData>({} as FinancialPlanContextData);

// Provider do contexto
export const FinancialPlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { goals, updateGoal } = useGoals();
  const [financialPlan, setFinancialPlan] = useState<FinancialPlan>(DEFAULT_FINANCIAL_PLAN);
  const [loading, setLoading] = useState(true);

  // Carregar plano financeiro ao iniciar
  useEffect(() => {
    const loadFinancialPlan = async () => {
      try {
        const storedPlan = await AsyncStorage.getItem(FINANCIAL_PLAN_KEY);
        if (storedPlan) {
          setFinancialPlan(JSON.parse(storedPlan));
        }
      } catch (error) {
        console.error('Erro ao carregar plano financeiro:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFinancialPlan();
  }, []);

  // Atualizar o plano financeiro
  const updateFinancialPlan = async (plan: Partial<FinancialPlan>) => {
    try {
      const updatedPlan = { ...financialPlan, ...plan };
      setFinancialPlan(updatedPlan);
      await AsyncStorage.setItem(FINANCIAL_PLAN_KEY, JSON.stringify(updatedPlan));
      
      // Recalcular contribuições mensais após atualizar o plano
      if (updatedPlan.autoDistribute) {
        await recalculateGoalContributions();
      }
    } catch (error) {
      console.error('Erro ao atualizar plano financeiro:', error);
      throw error;
    }
  };

  // Recalcular contribuições mensais para as metas
  const recalculateGoalContributions = async () => {
    if (!financialPlan.autoDistribute || goals.length === 0) return;
    
    try {
      const updatedGoals = calculateMonthlyContributions(goals, financialPlan);
      
      // Atualizar cada meta com a nova contribuição mensal
      for (const goal of updatedGoals) {
        if (goal._id && goal.monthlyContribution !== 0) {
          await updateGoal(goal._id, goal);
        }
      }
    } catch (error) {
      console.error('Erro ao recalcular contribuições:', error);
      throw error;
    }
  };

  // Tratar conclusão de uma meta (redistribuição)
  const handleGoalCompletion = async (goalId: string) => {
    try {
      const updatedGoals = redistributeCompletedGoals(goals, goalId);
      
      // Atualizar metas com valores redistribuídos
      for (const goal of updatedGoals) {
        if (goal._id && goal._id !== goalId) {
          await updateGoal(goal._id, goal);
        }
      }
    } catch (error) {
      console.error('Erro ao redistribuir valores de meta concluída:', error);
      throw error;
    }
  };

  return (
    <FinancialPlanContext.Provider value={{
      financialPlan,
      loading,
      updateFinancialPlan,
      recalculateGoalContributions,
      handleGoalCompletion
    }}>
      {children}
    </FinancialPlanContext.Provider>
  );
};

// Hook para usar o contexto
export const useFinancialPlan = () => useContext(FinancialPlanContext);