// src/store/slices/budgetSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Budget, CreateBudgetData, BudgetProgress } from '../../types';
import * as budgetAPI from '../../services/api';

export interface BudgetState {
  budgets: Budget[];
  currentBudget: Budget | null;
  budgetProgress: Record<string, BudgetProgress>;
  monthlyBudgets: Budget[];
  categoryBudgets: Record<string, Budget[]>;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  lastSync: number | null;
  selectedMonth: string; // YYYY-MM format
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overBudgetCategories: string[];
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  category: string;
  message: string;
  percentage: number;
  amount: number;
  timestamp: string;
}

const initialState: BudgetState = {
  budgets: [],
  currentBudget: null,
  budgetProgress: {},
  monthlyBudgets: [],
  categoryBudgets: {},
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  lastSync: null,
  selectedMonth: new Date().toISOString().slice(0, 7), // YYYY-MM atual
  totalBudget: 0,
  totalSpent: 0,
  totalRemaining: 0,
  overBudgetCategories: [],
  alerts: []
};

// 💰 Async Thunks
export const fetchBudgets = createAsyncThunk(
  'budgets/fetchBudgets',
  async (month: string = new Date().toISOString().slice(0, 7), { rejectWithValue }) => {
    try {
      const response = await budgetAPI.getBudgets(month);
      return { budgets: response.data, month };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar orçamentos');
    }
  }
);

export const createBudget = createAsyncThunk(
  'budgets/createBudget',
  async (budgetData: CreateBudgetData, { rejectWithValue }) => {
    try {
      const response = await budgetAPI.createBudget(budgetData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar orçamento');
    }
  }
);

export const updateBudget = createAsyncThunk(
  'budgets/updateBudget',
  async ({ id, data }: { id: string; data: Partial<Budget> }, { rejectWithValue }) => {
    try {
      const response = await budgetAPI.updateBudget(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar orçamento');
    }
  }
);

export const deleteBudget = createAsyncThunk(
  'budgets/deleteBudget',
  async (id: string, { rejectWithValue }) => {
    try {
      await budgetAPI.deleteBudget(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao excluir orçamento');
    }
  }
);

export const fetchBudgetProgress = createAsyncThunk(
  'budgets/fetchProgress',
  async (month: string, { rejectWithValue }) => {
    try {
      const response = await budgetAPI.getBudgetProgress(month);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar progresso');
    }
  }
);

const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    // 🔄 Limpar erros
    clearError: (state) => {
      state.error = null;
    },

    // 💰 Selecionar orçamento atual
    setCurrentBudget: (state, action: PayloadAction<Budget | null>) => {
      state.currentBudget = action.payload;
    },

    // 📅 Selecionar mês
    setSelectedMonth: (state, action: PayloadAction<string>) => {
      state.selectedMonth = action.payload;
    },

    // 📊 Atualizar progresso do orçamento
    updateBudgetProgress: (state, action: PayloadAction<{
      budgetId: string;
      spent: number;
      remaining: number;
      percentage: number;
    }>) => {
      const { budgetId, spent, remaining, percentage } = action.payload;
      state.budgetProgress[budgetId] = {
        percentage,
        spent,
        remaining,
        isOverBudget: percentage > 100,
        projectedTotal: calculateProjectedTotal(spent)
      };

      // Verificar se passou do orçamento
      if (percentage > 100) {
        const budget = state.budgets.find(b => b.id === budgetId);
        if (budget && !state.overBudgetCategories.includes(budget.category)) {
          state.overBudgetCategories.push(budget.category);
        }
      }
    },

    // 🚨 Gerar alertas de orçamento
    generateBudgetAlerts: (state) => {
      state.alerts = [];
      
      state.budgets.forEach(budget => {
        const progress = state.budgetProgress[budget.id];
        if (!progress) return;

        const alertId = `${budget.id}-${Date.now()}`;
        
        if (progress.percentage >= 100) {
          // Orçamento estourado
          state.alerts.push({
            id: alertId,
            type: 'danger',
            category: budget.category,
            message: `Orçamento de ${budget.category} foi ultrapassado em ${(progress.percentage - 100).toFixed(1)}%`,
            percentage: progress.percentage,
            amount: progress.spent - budget.amount,
            timestamp: new Date().toISOString()
          });
        } else if (progress.percentage >= 90) {
          // Alerta crítico - 90%+
          state.alerts.push({
            id: alertId,
            type: 'warning',
            category: budget.category,
            message: `Você já gastou ${progress.percentage.toFixed(1)}% do orçamento de ${budget.category}`,
            percentage: progress.percentage,
            amount: progress.spent,
            timestamp: new Date().toISOString()
          });
        } else if (progress.percentage >= 75) {
          // Alerta de atenção - 75%+
          state.alerts.push({
            id: alertId,
            type: 'info',
            category: budget.category,
            message: `Você gastou ${progress.percentage.toFixed(1)}% do orçamento de ${budget.category}`,
            percentage: progress.percentage,
            amount: progress.spent,
            timestamp: new Date().toISOString()
          });
        }
      });
    },

    // 🗑️ Remover alerta
    dismissAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
    },

    // 🗂️ Categorizar orçamentos por categoria
    categorizeBudgets: (state) => {
      state.categoryBudgets = {};
      state.budgets.forEach(budget => {
        if (!state.categoryBudgets[budget.category]) {
          state.categoryBudgets[budget.category] = [];
        }
        state.categoryBudgets[budget.category].push(budget);
      });
    },

    // 📊 Calcular totais
    calculateTotals: (state) => {
      state.totalBudget = state.budgets.reduce((total, budget) => total + budget.amount, 0);
      state.totalSpent = Object.values(state.budgetProgress).reduce(
        (total, progress) => total + (progress.spent || 0), 0
      );
      state.totalRemaining = state.totalBudget - state.totalSpent;
    },

    // 🔄 Reset de alertas expirados
    cleanupExpiredAlerts: (state) => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      state.alerts = state.alerts.filter(
        alert => new Date(alert.timestamp) > oneDayAgo
      );
    },

    // 💾 Marcar como não sincronizado
    markAsUnsyncedBudget: (state, action: PayloadAction<string>) => {
      const budgetIndex = state.budgets.findIndex(budget => budget.id === action.payload);
      if (budgetIndex !== -1) {
        // Removido needsSync pois não existe no tipo Budget
        // state.budgets[budgetIndex].needsSync = true;
      }
    },

    // 🔄 Atualizar timestamp de sincronização
    updateLastSync: (state) => {
      state.lastSync = Date.now();
    },

    // 📱 Carregar dados offline
    loadOfflineBudgets: (state, action: PayloadAction<Budget[]>) => {
      state.budgets = action.payload;
      budgetSlice.caseReducers.categorizeBudgets(state);
      budgetSlice.caseReducers.calculateTotals(state);
    }
  },

  extraReducers: (builder) => {
    // 📋 Buscar orçamentos
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budgets = action.payload.budgets;
        if (action.payload.month) {
          state.selectedMonth = action.payload.month;
        }
        state.lastSync = Date.now();
        budgetSlice.caseReducers.categorizeBudgets(state);
        budgetSlice.caseReducers.calculateTotals(state);
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ➕ Criar orçamento
    builder
      .addCase(createBudget.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.isCreating = false;
        state.budgets.push(action.payload);
        budgetSlice.caseReducers.categorizeBudgets(state);
        budgetSlice.caseReducers.calculateTotals(state);
      })
      .addCase(createBudget.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });

    // ✏️ Atualizar orçamento
    builder
      .addCase(updateBudget.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.budgets.findIndex(budget => budget.id === action.payload.id);
        if (index !== -1) {
          state.budgets[index] = action.payload;
        }
        budgetSlice.caseReducers.categorizeBudgets(state);
        budgetSlice.caseReducers.calculateTotals(state);
      })
      .addCase(updateBudget.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // 🗑️ Excluir orçamento
    builder
      .addCase(deleteBudget.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.budgets = state.budgets.filter(budget => budget.id !== action.payload);
        delete state.budgetProgress[action.payload];
        state.overBudgetCategories = state.overBudgetCategories.filter(
          category => state.budgets.some(b => b.category === category)
        );
        budgetSlice.caseReducers.categorizeBudgets(state);
        budgetSlice.caseReducers.calculateTotals(state);
      })
      .addCase(deleteBudget.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });

    // 📊 Buscar progresso dos orçamentos
    builder
      .addCase(fetchBudgetProgress.fulfilled, (state, action) => {
        state.budgetProgress = action.payload as Record<string, BudgetProgress>;
        
        // Recalcular over budget categories
        state.overBudgetCategories = [];
        Object.entries(action.payload as Record<string, BudgetProgress>).forEach(([budgetId, progress]) => {
          if (progress.isOverBudget) {
            const budget = state.budgets.find(b => b.id === budgetId);
            if (budget && !state.overBudgetCategories.includes(budget.category)) {
              state.overBudgetCategories.push(budget.category);
            }
          }
        });
        
        budgetSlice.caseReducers.calculateTotals(state);
        budgetSlice.caseReducers.generateBudgetAlerts(state);
      });
  }
});

// 🧮 Funções auxiliares
function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

function calculateProjectedTotal(currentSpent: number): number {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();
  const dailyAverage = currentSpent / daysPassed;
  return dailyAverage * daysInMonth;
}

// 🎯 Seletores
export const selectBudgets = (state: { budgets: BudgetState }) => state.budgets.budgets;
export const selectCurrentBudget = (state: { budgets: BudgetState }) => state.budgets.currentBudget;
export const selectBudgetProgress = (state: { budgets: BudgetState }) => state.budgets.budgetProgress;
export const selectMonthlyBudgets = (state: { budgets: BudgetState }) => state.budgets.monthlyBudgets;
export const selectCategoryBudgets = (state: { budgets: BudgetState }) => state.budgets.categoryBudgets;
export const selectBudgetsLoading = (state: { budgets: BudgetState }) => state.budgets.isLoading;
export const selectBudgetsError = (state: { budgets: BudgetState }) => state.budgets.error;
export const selectSelectedMonth = (state: { budgets: BudgetState }) => state.budgets.selectedMonth;
export const selectBudgetTotals = (state: { budgets: BudgetState }) => ({
  total: state.budgets.totalBudget,
  spent: state.budgets.totalSpent,
  remaining: state.budgets.totalRemaining
});
export const selectOverBudgetCategories = (state: { budgets: BudgetState }) => state.budgets.overBudgetCategories;
export const selectBudgetAlerts = (state: { budgets: BudgetState }) => state.budgets.alerts;

// Seletor para orçamentos do mês selecionado
export const selectBudgetsForSelectedMonth = (state: { budgets: BudgetState }) => {
  return state.budgets.budgets.filter(budget => 
    budget.month === state.budgets.selectedMonth
  );
};

// Seletor para estatísticas do orçamento
export const selectBudgetStats = (state: { budgets: BudgetState }) => {
  const budgets = state.budgets.budgets;
  const progress = state.budgets.budgetProgress;
  
  if (budgets.length === 0) {
    return {
      totalCategories: 0,
      overBudgetCount: 0,
      onTrackCount: 0,
      warningCount: 0,
      averageUtilization: 0
    };
  }

  const overBudgetCount = budgets.filter(budget => {
    const prog = progress[budget.id];
    return prog && prog.percentage > 100;
  }).length;

  const warningCount = budgets.filter(budget => {
    const prog = progress[budget.id];
    return prog && prog.percentage >= 75 && prog.percentage <= 100;
  }).length;

  const onTrackCount = budgets.length - overBudgetCount - warningCount;

  const totalUtilization = budgets.reduce((sum, budget) => {
    const prog = progress[budget.id];
    return sum + (prog ? prog.percentage : 0);
  }, 0);

  return {
    totalCategories: budgets.length,
    overBudgetCount,
    onTrackCount,
    warningCount,
    averageUtilization: totalUtilization / budgets.length
  };
};

// Seletor para orçamentos por categoria (agrupados)
export const selectBudgetsByCategory = (state: { budgets: BudgetState }) => {
  const budgets = state.budgets.budgets;
  const progress = state.budgets.budgetProgress;
  
  const grouped = budgets.reduce((acc, budget) => {
    if (!acc[budget.category]) {
      acc[budget.category] = {
        category: budget.category,
        budgets: [],
        totalAmount: 0,
        totalSpent: 0,
        totalRemaining: 0,
        averageUtilization: 0
      };
    }
    
    const budgetProgress = progress[budget.id];
    acc[budget.category].budgets.push(budget);
    acc[budget.category].totalAmount += budget.amount;
    acc[budget.category].totalSpent += budgetProgress?.spent || 0;
    acc[budget.category].totalRemaining += budgetProgress?.remaining || budget.amount;
    
    return acc;
  }, {} as Record<string, any>);

  // Calcular utilização média por categoria
  Object.values(grouped).forEach((group: any) => {
    group.averageUtilization = group.totalAmount > 0 
      ? (group.totalSpent / group.totalAmount) * 100 
      : 0;
  });

  return grouped;
};

export const {
  clearError,
  setCurrentBudget,
  setSelectedMonth,
  updateBudgetProgress,
  generateBudgetAlerts,
  dismissAlert,
  categorizeBudgets,
  calculateTotals,
  cleanupExpiredAlerts,
  markAsUnsyncedBudget,
  updateLastSync,
  loadOfflineBudgets
} = budgetSlice.actions;

export default budgetSlice.reducer;