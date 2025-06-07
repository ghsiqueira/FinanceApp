// src/store/slices/goalSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Goal, CreateGoalData, GoalProgress } from '../../types';
import * as goalAPI from '../../services/api';

export interface GoalState {
  goals: Goal[];
  activeGoals: Goal[];
  completedGoals: Goal[];
  currentGoal: Goal | null;
  goalProgress: Record<string, GoalProgress>;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  lastSync: number | null;
  filters: {
    category?: string;
    status?: 'active' | 'completed' | 'paused';
    priority?: 'baixa' | 'media' | 'alta';
  };
  sortBy: 'targetDate' | 'targetAmount' | 'progress' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

const initialState: GoalState = {
  goals: [],
  activeGoals: [],
  completedGoals: [],
  currentGoal: null,
  goalProgress: {},
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  lastSync: null,
  filters: {},
  sortBy: 'targetDate',
  sortOrder: 'asc'
};

// 🎯 Async Thunks
export const fetchGoals = createAsyncThunk(
  'goals/fetchGoals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await goalAPI.getGoals();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar metas');
    }
  }
);

export const createGoal = createAsyncThunk(
  'goals/createGoal',
  async (goalData: CreateGoalData, { rejectWithValue }) => {
    try {
      const response = await goalAPI.createGoal(goalData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar meta');
    }
  }
);

export const updateGoal = createAsyncThunk(
  'goals/updateGoal',
  async ({ id, data }: { id: string; data: Partial<Goal> }, { rejectWithValue }) => {
    try {
      const response = await goalAPI.updateGoal(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar meta');
    }
  }
);

export const deleteGoal = createAsyncThunk(
  'goals/deleteGoal',
  async (id: string, { rejectWithValue }) => {
    try {
      await goalAPI.deleteGoal(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao excluir meta');
    }
  }
);

export const addGoalContribution = createAsyncThunk(
  'goals/addContribution',
  async ({ goalId, amount }: { goalId: string; amount: number }, { rejectWithValue }) => {
    try {
      const response = await goalAPI.addGoalContribution(goalId, amount);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao adicionar contribuição');
    }
  }
);

const goalSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    // 🔄 Limpar erros
    clearError: (state) => {
      state.error = null;
    },

    // 🎯 Selecionar meta atual
    setCurrentGoal: (state, action: PayloadAction<Goal | null>) => {
      state.currentGoal = action.payload;
    },

    // 🔍 Definir filtros
    setFilters: (state, action: PayloadAction<GoalState['filters']>) => {
      state.filters = action.payload;
    },

    // 📊 Definir ordenação
    setSorting: (state, action: PayloadAction<{
      sortBy: GoalState['sortBy'];
      sortOrder: GoalState['sortOrder'];
    }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },

    // 🏆 Marcar meta como concluída localmente
    markGoalCompleted: (state, action: PayloadAction<string>) => {
      const goalIndex = state.goals.findIndex(goal => goal.id === action.payload);
      if (goalIndex !== -1) {
        state.goals[goalIndex].isCompleted = true;
        // Removido completedAt pois não existe no tipo Goal
      }
    },

    // ⏸️ Pausar/Retomar meta
    toggleGoalPause: (state, action: PayloadAction<string>) => {
      const goalIndex = state.goals.findIndex(goal => goal.id === action.payload);
      if (goalIndex !== -1) {
        const goal = state.goals[goalIndex];
        goal.isPaused = !goal.isPaused;
        // Removido pausedAt pois não existe no tipo Goal
      }
    },

    // 💰 Atualizar progresso local
    updateGoalProgress: (state, action: PayloadAction<{
      goalId: string;
      currentAmount: number;
      lastContribution?: number;
    }>) => {
      const { goalId, currentAmount, lastContribution } = action.payload;
      const goalIndex = state.goals.findIndex(goal => goal.id === goalId);
      
      if (goalIndex !== -1) {
        state.goals[goalIndex].currentAmount = currentAmount;
        if (lastContribution) {
          state.goals[goalIndex].lastContribution = lastContribution;
          // Removido lastContributionAt pois não existe no tipo Goal
        }
      }

      // Atualizar progresso calculado
      const goal = state.goals[goalIndex];
      if (goal) {
        const progressPercentage = Math.min((currentAmount / goal.targetAmount) * 100, 100);
        state.goalProgress[goalId] = {
          percentage: progressPercentage,
          isCompleted: progressPercentage >= 100,
          projectedCompletionDate: calculateProjectedDate(goal),
          monthlyTarget: calculateMonthlyTarget(goal),
          onTrack: isOnTrack(goal)
        };
      }
    },

    // 🗂️ Categorizar metas
    categorizeGoals: (state) => {
      state.activeGoals = state.goals.filter(
        goal => !goal.isCompleted && !goal.isPaused
      );
      state.completedGoals = state.goals.filter(goal => goal.isCompleted);
    },

    // 💾 Sincronização offline
    markAsUnsyncedGoal: (state, action: PayloadAction<string>) => {
      const goalIndex = state.goals.findIndex(goal => goal.id === action.payload);
      if (goalIndex !== -1) {
        // Removido needsSync pois não existe no tipo Goal
        // state.goals[goalIndex].needsSync = true;
      }
    },

    // 🔄 Atualizar timestamp de sincronização
    updateLastSync: (state) => {
      state.lastSync = Date.now();
    }
  },

  extraReducers: (builder) => {
    // 📋 Buscar metas
    builder
      .addCase(fetchGoals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goals = action.payload;
        state.lastSync = Date.now();
        goalSlice.caseReducers.categorizeGoals(state);
        
        // Calcular progresso para todas as metas
        action.payload.forEach((goal: Goal) => {
          const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          state.goalProgress[goal.id] = {
            percentage: progressPercentage,
            isCompleted: progressPercentage >= 100,
            projectedCompletionDate: calculateProjectedDate(goal),
            monthlyTarget: calculateMonthlyTarget(goal),
            onTrack: isOnTrack(goal)
          };
        });
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ➕ Criar meta
    builder
      .addCase(createGoal.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.isCreating = false;
        state.goals.push(action.payload);
        goalSlice.caseReducers.categorizeGoals(state);
        
        // Inicializar progresso
        const goal = action.payload;
        const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
        state.goalProgress[goal.id] = {
          percentage: progressPercentage,
          isCompleted: progressPercentage >= 100,
          projectedCompletionDate: calculateProjectedDate(goal),
          monthlyTarget: calculateMonthlyTarget(goal),
          onTrack: isOnTrack(goal)
        };
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });

    // ✏️ Atualizar meta
    builder
      .addCase(updateGoal.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.goals.findIndex(goal => goal.id === action.payload.id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
        goalSlice.caseReducers.categorizeGoals(state);
        
        // Recalcular progresso
        const goal = action.payload;
        const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
        state.goalProgress[goal.id] = {
          percentage: progressPercentage,
          isCompleted: progressPercentage >= 100,
          projectedCompletionDate: calculateProjectedDate(goal),
          monthlyTarget: calculateMonthlyTarget(goal),
          onTrack: isOnTrack(goal)
        };
      })
      .addCase(updateGoal.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // 🗑️ Excluir meta
    builder
      .addCase(deleteGoal.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.goals = state.goals.filter(goal => goal.id !== action.payload);
        delete state.goalProgress[action.payload];
        goalSlice.caseReducers.categorizeGoals(state);
      })
      .addCase(deleteGoal.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });

    // 💰 Adicionar contribuição
    builder
      .addCase(addGoalContribution.fulfilled, (state, action) => {
        const goal = action.payload;
        const index = state.goals.findIndex(g => g.id === goal.id);
        if (index !== -1) {
          state.goals[index] = goal;
        }
        
        // Recalcular progresso
        const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
        state.goalProgress[goal.id] = {
          percentage: progressPercentage,
          isCompleted: progressPercentage >= 100,
          projectedCompletionDate: calculateProjectedDate(goal),
          monthlyTarget: calculateMonthlyTarget(goal),
          onTrack: isOnTrack(goal)
        };
        
        goalSlice.caseReducers.categorizeGoals(state);
      });
  }
});

// 🧮 Funções auxiliares para cálculos
function calculateProjectedDate(goal: Goal): string | null {
  if (!goal.lastContribution || goal.lastContribution <= 0) return null;
  
  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0) return new Date().toISOString();
  
  const monthsToComplete = Math.ceil(remaining / goal.lastContribution);
  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + monthsToComplete);
  
  return projectedDate.toISOString();
}

function calculateMonthlyTarget(goal: Goal): number {
  const targetDate = new Date(goal.targetDate);
  const now = new Date();
  const monthsRemaining = Math.max(
    1,
    (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth())
  );
  
  const remaining = goal.targetAmount - goal.currentAmount;
  return Math.max(0, remaining / monthsRemaining);
}

function isOnTrack(goal: Goal): boolean {
  const targetDate = new Date(goal.targetDate);
  const startDate = new Date(goal.createdAt);
  const now = new Date();
  
  const totalTimespan = targetDate.getTime() - startDate.getTime();
  const timeElapsed = now.getTime() - startDate.getTime();
  const expectedProgress = Math.min(timeElapsed / totalTimespan, 1);
  const actualProgress = goal.currentAmount / goal.targetAmount;
  
  return actualProgress >= expectedProgress * 0.9; // 10% de tolerância
}

// 🎯 Seletores
export const selectGoals = (state: { goals: GoalState }) => state.goals.goals;
export const selectActiveGoals = (state: { goals: GoalState }) => state.goals.activeGoals;
export const selectCompletedGoals = (state: { goals: GoalState }) => state.goals.completedGoals;
export const selectCurrentGoal = (state: { goals: GoalState }) => state.goals.currentGoal;
export const selectGoalProgress = (state: { goals: GoalState }) => state.goals.goalProgress;
export const selectGoalsLoading = (state: { goals: GoalState }) => state.goals.isLoading;
export const selectGoalsError = (state: { goals: GoalState }) => state.goals.error;
export const selectGoalFilters = (state: { goals: GoalState }) => state.goals.filters;

// Seletor para metas filtradas e ordenadas
export const selectFilteredGoals = (state: { goals: GoalState }) => {
  const { goals, filters, sortBy, sortOrder } = state.goals;
  
  let filtered = goals.filter(goal => {
    if (filters.category && goal.category !== filters.category) return false;
    if (filters.status === 'active' && (goal.isCompleted || goal.isPaused)) return false;
    if (filters.status === 'completed' && !goal.isCompleted) return false;
    if (filters.status === 'paused' && !goal.isPaused) return false;
    if (filters.priority && goal.priority !== filters.priority) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    if (sortBy === 'progress') {
      aValue = a.currentAmount / a.targetAmount;
      bValue = b.currentAmount / b.targetAmount;
    } else {
      aValue = (a as any)[sortBy];
      bValue = (b as any)[sortBy];
    }
    
    if (typeof aValue === 'string') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    const comparison = aValue > bValue ? 1 : -1;
    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

export const {
  clearError,
  setCurrentGoal,
  setFilters,
  setSorting,
  markGoalCompleted,
  toggleGoalPause,
  updateGoalProgress,
  categorizeGoals,
  markAsUnsyncedGoal,
  updateLastSync
} = goalSlice.actions;

export default goalSlice.reducer;