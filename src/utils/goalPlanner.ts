// src/utils/goalPlanner.ts - Novo arquivo
import { Goal, FinancialPlan } from '../types';
import { differenceInMonths } from 'date-fns';

/**
 * Calcula a distribuição ideal de contribuições mensais para as metas
 */
export const calculateMonthlyContributions = (
  goals: Goal[],
  financialPlan: FinancialPlan
): Goal[] => {
  // Metas que não foram concluídas
  const activeGoals = goals.filter(goal => !goal.isCompleted);
  
  if (activeGoals.length === 0) return goals;
  
  // Calcular valor total disponível para as metas
  const totalAvailable = financialPlan.monthlyIncome * (financialPlan.savingsPercentage / 100);
  
  // Pontuação total de prioridade (inversa - prioridade menor tem peso maior)
  // Prioridade 1 (muito alta) = 5 pontos, prioridade 5 (muito baixa) = 1 ponto
  const prioritySum = activeGoals.reduce((sum, goal) => {
    const priorityScore = 6 - goal.priority; // Inverter para dar mais peso às prioridades altas
    return sum + priorityScore;
  }, 0);
  
  // Distribuir com base na prioridade e prazo
  return goals.map(goal => {
    if (goal.isCompleted) return goal;
    
    // Calcular pontuação de prioridade
    const priorityScore = 6 - goal.priority;
    
    // Distribuição básica por prioridade
    let suggestedContribution = (priorityScore / prioritySum) * totalAvailable;
    
    // Ajustar com base no deadline se existir
    if (goal.deadline) {
      const today = new Date();
      const deadline = new Date(goal.deadline);
      const monthsLeft = Math.max(1, differenceInMonths(deadline, today));
      
      // Valor mínimo necessário para atingir a meta no prazo
      const requiredMonthly = (goal.targetAmount - goal.currentAmount) / monthsLeft;
      
      // Usar o maior entre o valor por prioridade e o valor necessário por prazo
      suggestedContribution = Math.max(suggestedContribution, requiredMonthly);
    }
    
    // Arredondar para duas casas decimais
    suggestedContribution = Math.round(suggestedContribution * 100) / 100;
    
    return {
      ...goal,
      monthlyContribution: suggestedContribution
    };
  });
};

/**
 * Redistribui o valor excedente de metas concluídas
 */
export const redistributeCompletedGoals = (
  goals: Goal[],
  completedGoalId: string
): Goal[] => {
  // Encontrar a meta concluída
  const completedGoal = goals.find(goal => goal._id === completedGoalId);
  if (!completedGoal || !completedGoal.autoRedistribute) return goals;
  
  // Calcular valor excedente
  const excess = completedGoal.currentAmount - completedGoal.targetAmount;
  if (excess <= 0) return goals;
  
  // Metas ativas para redistribuir
  const activeGoals = goals.filter(goal => 
    !goal.isCompleted && goal._id !== completedGoalId
  );
  
  if (activeGoals.length === 0) return goals;
  
  // Calcular pontuação total de prioridade
  const prioritySum = activeGoals.reduce((sum, goal) => {
    const priorityScore = 6 - goal.priority;
    return sum + priorityScore;
  }, 0);
  
  // Distribuir o excesso com base na prioridade
  return goals.map(goal => {
    if (goal.isCompleted || goal._id === completedGoalId) return goal;
    
    const priorityScore = 6 - goal.priority;
    const share = (priorityScore / prioritySum) * excess;
    
    return {
      ...goal,
      currentAmount: goal.currentAmount + share
    };
  });
};

export default {
  calculateMonthlyContributions,
  redistributeCompletedGoals
};