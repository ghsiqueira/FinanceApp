// src/services/budgetService.ts
import { Transaction, Category } from '../types';
import { storeData, getData } from '../utils/storage';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface BudgetCategory {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  status: 'under' | 'near' | 'over'; // under budget, near limit, over budget
}

export interface MonthlyBudget {
  id: string;
  month: number;
  year: number;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  categories: BudgetCategory[];
  alerts: BudgetAlert[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  categoryId?: string;
  message: string;
  threshold: number;
  isActive: boolean;
}

export interface BudgetSettings {
  enableAlerts: boolean;
  warningThreshold: number; // Porcentagem para aviso (ex: 80%)
  dangerThreshold: number; // Porcentagem para alerta crítico (ex: 95%)
  autoCreateMonthlyBudget: boolean;
  baseBudgetOnPreviousMonth: boolean;
}

class BudgetService {
  private static instance: BudgetService;
  private readonly STORAGE_KEY = '@FinanceApp:budgets';
  private readonly SETTINGS_KEY = '@FinanceApp:budgetSettings';

  static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService();
    }
    return BudgetService.instance;
  }

  /**
   * Cria ou atualiza orçamento mensal
   */
  async createOrUpdateBudget(
    year: number,
    month: number,
    categoryBudgets: { categoryId: string; amount: number }[]
  ): Promise<MonthlyBudget> {
    try {
      const budgetId = `${year}-${month}`;
      const budgets = await getData<Record<string, MonthlyBudget>>(this.STORAGE_KEY) || {};
      
      // Calcular total do orçamento
      const totalBudget = categoryBudgets.reduce((sum, cat) => sum + cat.amount, 0);
      
      // Criar estrutura do orçamento
      const budget: MonthlyBudget = {
        id: budgetId,
        month,
        year,
        totalBudget,
        totalSpent: 0,
        totalRemaining: totalBudget,
        categories: categoryBudgets.map(cat => ({
          categoryId: cat.categoryId,
          categoryName: '', // Será preenchido ao atualizar
          categoryColor: '',
          budgetAmount: cat.amount,
          spentAmount: 0,
          remainingAmount: cat.amount,
          percentage: 0,
          status: 'under' as const
        })),
        alerts: [],
        createdAt: budgets[budgetId]?.createdAt || new Date(),
        updatedAt: new Date()
      };

      budgets[budgetId] = budget;
      await storeData(this.STORAGE_KEY, budgets);

      return budget;
    } catch (error) {
      console.error('Erro ao criar/atualizar orçamento:', error);
      throw error;
    }
  }

  /**
   * Atualiza orçamento com transações atuais
   */
  async updateBudgetWithTransactions(
    year: number,
    month: number,
    transactions: Transaction[],
    categories: Category[]
  ): Promise<MonthlyBudget | null> {
    try {
      const budgetId = `${year}-${month}`;
      const budgets = await getData<Record<string, MonthlyBudget>>(this.STORAGE_KEY) || {};
      const budget = budgets[budgetId];

      if (!budget) return null;

      // Criar mapa de categorias para facilitar lookup
      const categoryMap = new Map(categories.map(cat => [cat._id!, cat]));

      // Calcular gastos por categoria
      const categorySpending = new Map<string, number>();
      
      transactions
        .filter(t => t.type === 'expense')
        .forEach(transaction => {
          const categoryId = typeof transaction.category === 'string' 
            ? transaction.category 
            : transaction.category._id!;
          
          const current = categorySpending.get(categoryId) || 0;
          categorySpending.set(categoryId, current + transaction.amount);
        });

      // Atualizar categorias do orçamento
      budget.categories = budget.categories.map(budgetCat => {
        const category = categoryMap.get(budgetCat.categoryId);
        const spentAmount = categorySpending.get(budgetCat.categoryId) || 0;
        const remainingAmount = budgetCat.budgetAmount - spentAmount;
        const percentage = budgetCat.budgetAmount > 0 
          ? (spentAmount / budgetCat.budgetAmount) * 100 
          : 0;

        // Determinar status
        let status: 'under' | 'near' | 'over' = 'under';
        if (percentage >= 100) {
          status = 'over';
        } else if (percentage >= 80) {
          status = 'near';
        }

        return {
          ...budgetCat,
          categoryName: category?.name || budgetCat.categoryName,
          categoryColor: category?.color || budgetCat.categoryColor,
          spentAmount,
          remainingAmount,
          percentage,
          status
        };
      });

      // Atualizar totais
      budget.totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
      budget.totalRemaining = budget.totalBudget - budget.totalSpent;
      budget.updatedAt = new Date();

      // Gerar alertas
      budget.alerts = this.generateBudgetAlerts(budget);

      // Salvar orçamento atualizado
      budgets[budgetId] = budget;
      await storeData(this.STORAGE_KEY, budgets);

      return budget;
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error);
      throw error;
    }
  }

  /**
   * Obtém orçamento de um mês específico
   */
  async getBudget(year: number, month: number): Promise<MonthlyBudget | null> {
    try {
      const budgetId = `${year}-${month}`;
      const budgets = await getData<Record<string, MonthlyBudget>>(this.STORAGE_KEY) || {};
      return budgets[budgetId] || null;
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
      return null;
    }
  }

  /**
   * Lista todos os orçamentos
   */
  async getAllBudgets(): Promise<MonthlyBudget[]> {
    try {
      const budgets = await getData<Record<string, MonthlyBudget>>(this.STORAGE_KEY) || {};
      return Object.values(budgets).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    } catch (error) {
      console.error('Erro ao listar orçamentos:', error);
      return [];
    }
  }

  /**
   * Exclui orçamento
   */
  async deleteBudget(year: number, month: number): Promise<void> {
    try {
      const budgetId = `${year}-${month}`;
      const budgets = await getData<Record<string, MonthlyBudget>>(this.STORAGE_KEY) || {};
      
      delete budgets[budgetId];
      await storeData(this.STORAGE_KEY, budgets);
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      throw error;
    }
  }

  /**
   * Cria orçamento baseado no mês anterior
   */
  async createBudgetBasedOnPrevious(year: number, month: number): Promise<MonthlyBudget | null> {
    try {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      
      const prevBudget = await this.getBudget(prevYear, prevMonth);
      if (!prevBudget) return null;

      const categoryBudgets = prevBudget.categories.map(cat => ({
        categoryId: cat.categoryId,
        amount: cat.budgetAmount
      }));

      return await this.createOrUpdateBudget(year, month, categoryBudgets);
    } catch (error) {
      console.error('Erro ao criar orçamento baseado no anterior:', error);
      return null;
    }
  }

  /**
   * Configurações do sistema de orçamento
   */
  async getBudgetSettings(): Promise<BudgetSettings> {
    try {
      const settings = await getData<BudgetSettings>(this.SETTINGS_KEY);
      return settings || {
        enableAlerts: true,
        warningThreshold: 80,
        dangerThreshold: 95,
        autoCreateMonthlyBudget: false,
        baseBudgetOnPreviousMonth: true
      };
    } catch (error) {
      console.error('Erro ao buscar configurações do orçamento:', error);
      return {
        enableAlerts: true,
        warningThreshold: 80,
        dangerThreshold: 95,
        autoCreateMonthlyBudget: false,
        baseBudgetOnPreviousMonth: true
      };
    }
  }

  async saveBudgetSettings(settings: BudgetSettings): Promise<void> {
    try {
      await storeData(this.SETTINGS_KEY, settings);
    } catch (error) {
      console.error('Erro ao salvar configurações do orçamento:', error);
      throw error;
    }
  }

  /**
   * Gera relatório de performance do orçamento
   */
  async generateBudgetReport(year: number, month: number): Promise<{
    summary: {
      totalBudget: number;
      totalSpent: number;
      totalRemaining: number;
      overallPerformance: 'excellent' | 'good' | 'warning' | 'poor';
    };
    categoryPerformance: Array<{
      categoryName: string;
      budgeted: number;
      spent: number;
      variance: number;
      variancePercentage: number;
      performance: 'under' | 'on-track' | 'over';
    }>;
    recommendations: string[];
  } | null> {
    try {
      const budget = await this.getBudget(year, month);
      if (!budget) return null;

      const summary = {
        totalBudget: budget.totalBudget,
        totalSpent: budget.totalSpent,
        totalRemaining: budget.totalRemaining,
        overallPerformance: this.calculateOverallPerformance(budget)
      };

      const categoryPerformance = budget.categories.map(cat => {
        const variance = cat.budgetAmount - cat.spentAmount;
        const variancePercentage = cat.budgetAmount > 0 
          ? (variance / cat.budgetAmount) * 100 
          : 0;

        let performance: 'under' | 'on-track' | 'over' = 'on-track';
        if (variancePercentage < -5) performance = 'over';
        else if (variancePercentage > 10) performance = 'under';

        return {
          categoryName: cat.categoryName,
          budgeted: cat.budgetAmount,
          spent: cat.spentAmount,
          variance,
          variancePercentage,
          performance
        };
      });

      const recommendations = this.generateRecommendations(budget);

      return {
        summary,
        categoryPerformance,
        recommendations
      };
    } catch (error) {
      console.error('Erro ao gerar relatório do orçamento:', error);
      return null;
    }
  }

  // Métodos auxiliares privados
  private generateBudgetAlerts(budget: MonthlyBudget): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];
    const settings = { warningThreshold: 80, dangerThreshold: 95 }; // Valores padrão

    budget.categories.forEach(category => {
      if (category.percentage >= settings.dangerThreshold) {
        alerts.push({
          id: `${category.categoryId}-danger`,
          type: 'danger',
          categoryId: category.categoryId,
          message: `Orçamento de ${category.categoryName} ultrapassou ${settings.dangerThreshold}%`,
          threshold: settings.dangerThreshold,
          isActive: true
        });
      } else if (category.percentage >= settings.warningThreshold) {
        alerts.push({
          id: `${category.categoryId}-warning`,
          type: 'warning',
          categoryId: category.categoryId,
          message: `Orçamento de ${category.categoryName} chegou a ${Math.round(category.percentage)}%`,
          threshold: settings.warningThreshold,
          isActive: true
        });
      }
    });

    return alerts;
  }

  private calculateOverallPerformance(budget: MonthlyBudget): 'excellent' | 'good' | 'warning' | 'poor' {
    const overallPercentage = budget.totalBudget > 0 
      ? (budget.totalSpent / budget.totalBudget) * 100 
      : 0;

    if (overallPercentage <= 70) return 'excellent';
    if (overallPercentage <= 90) return 'good';
    if (overallPercentage <= 105) return 'warning';
    return 'poor';
  }

  private generateRecommendations(budget: MonthlyBudget): string[] {
    const recommendations: string[] = [];

    // Categorias com maior desvio
    const worstCategories = budget.categories
      .filter(cat => cat.percentage > 100)
      .sort((a, b) => b.percentage - a.percentage);

    if (worstCategories.length > 0) {
      recommendations.push(
        `Considere reduzir gastos em ${worstCategories[0].categoryName} (${Math.round(worstCategories[0].percentage)}% do orçamento)`
      );
    }

    // Categorias com economia
    const underbudgetCategories = budget.categories
      .filter(cat => cat.percentage < 70)
      .sort((a, b) => a.percentage - b.percentage);

    if (underbudgetCategories.length > 0) {
      recommendations.push(
        `Você economizou em ${underbudgetCategories[0].categoryName}. Considere realocar esse valor para outras metas.`
      );
    }

    return recommendations;
  }
}

export default BudgetService.getInstance();