// src/services/aiInsightsService.ts
import { Transaction, Category, Goal } from '../types';
import { 
  differenceInMonths, 
  startOfMonth, 
  endOfMonth, 
  subMonths,
  format,
  addMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Export the interface so it can be used in other files
export interface FinancialInsight {
  id: string;
  type: 'spending_pattern' | 'saving_opportunity' | 'budget_warning' | 'goal_suggestion' | 'trend_analysis';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category?: string;
  actionable: boolean;
  suggestions: string[];
  data?: any;
}

interface SpendingPattern {
  categoryId: string;
  categoryName: string;
  avgMonthlySpending: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  seasonality?: {
    peakMonth: number;
    lowMonth: number;
    variation: number;
  };
}

interface PredictionResult {
  nextMonthSpending: number;
  confidence: number;
  breakdown: Array<{
    categoryId: string;
    categoryName: string;
    predictedAmount: number;
  }>;
}

class AIInsightsService {
  private static instance: AIInsightsService;

  static getInstance(): AIInsightsService {
    if (!AIInsightsService.instance) {
      AIInsightsService.instance = new AIInsightsService();
    }
    return AIInsightsService.instance;
  }

  /**
   * Gera insights financeiros automaticamente
   */
  async generateInsights(
    transactions: Transaction[],
    categories: Category[],
    goals: Goal[]
  ): Promise<FinancialInsight[]> {
    const insights: FinancialInsight[] = [];

    try {
      // Análise de padrões de gastos
      const spendingPatterns = this.analyzeSpendingPatterns(transactions, categories);
      insights.push(...this.generateSpendingInsights(spendingPatterns));

      // Análise de oportunidades de economia
      const savingsOpportunities = this.identifySavingsOpportunities(transactions, categories);
      insights.push(...savingsOpportunities);

      // Análise de tendências
      const trendInsights = this.analyzeTrends(transactions, categories);
      insights.push(...trendInsights);

      // Análise de metas
      const goalInsights = this.analyzeGoalProgress(goals, transactions);
      insights.push(...goalInsights);

      // Previsões
      const predictions = this.generatePredictions(transactions, categories);
      insights.push(...this.generatePredictionInsights(predictions));

      // Alertas personalizados
      const alerts = this.generatePersonalizedAlerts(transactions, categories, goals);
      insights.push(...alerts);

      return insights.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      });
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      return [];
    }
  }

  /**
   * Analisa padrões de gastos por categoria
   */
  private analyzeSpendingPatterns(transactions: Transaction[], categories: Category[]): SpendingPattern[] {
    const patterns: SpendingPattern[] = [];
    const categoryMap = new Map(categories.map(cat => [cat._id!, cat]));

    // Agrupar transações por categoria e mês
    const monthlyData = new Map<string, Map<string, number>>();
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const categoryId = typeof transaction.category === 'string' 
          ? transaction.category 
          : transaction.category._id!;
        
        const date = new Date(transaction.date);
        const monthKey = format(date, 'yyyy-MM');
        
        if (!monthlyData.has(categoryId)) {
          monthlyData.set(categoryId, new Map());
        }
        
        const categoryData = monthlyData.get(categoryId)!;
        const current = categoryData.get(monthKey) || 0;
        categoryData.set(monthKey, current + transaction.amount);
      });

    // Analisar padrões para cada categoria
    monthlyData.forEach((monthData, categoryId) => {
      const category = categoryMap.get(categoryId);
      if (!category) return;

      const amounts = Array.from(monthData.values());
      if (amounts.length < 2) return;

      const avgSpending = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      
      // Calcular tendência
      const trend = this.calculateTrend(amounts);
      
      // Detectar sazonalidade se houver dados suficientes
      const seasonality = amounts.length >= 12 
        ? this.detectSeasonality(monthData) 
        : undefined;

      patterns.push({
        categoryId,
        categoryName: category.name,
        avgMonthlySpending: avgSpending,
        trend: trend.direction,
        trendPercentage: trend.percentage,
        seasonality
      });
    });

    return patterns;
  }

  /**
   * Gera insights baseados nos padrões de gastos
   */
  private generateSpendingInsights(patterns: SpendingPattern[]): FinancialInsight[] {
    const insights: FinancialInsight[] = [];

    patterns.forEach(pattern => {
      // Insight sobre aumento de gastos
      if (pattern.trend === 'increasing' && pattern.trendPercentage > 20) {
        insights.push({
          id: `spending-increase-${pattern.categoryId}`,
          type: 'spending_pattern',
          title: `Gastos com ${pattern.categoryName} em alta`,
          description: `Seus gastos com ${pattern.categoryName} aumentaram ${pattern.trendPercentage.toFixed(1)}% nos últimos meses.`,
          impact: pattern.trendPercentage > 50 ? 'high' : 'medium',
          category: pattern.categoryName,
          actionable: true,
          suggestions: [
            `Revise seus gastos em ${pattern.categoryName}`,
            'Defina um orçamento mais rigoroso para esta categoria',
            'Procure alternativas mais econômicas'
          ],
          data: {
            trend: pattern.trend,
            percentage: pattern.trendPercentage,
            avgAmount: pattern.avgMonthlySpending
          }
        });
      }

      // Insight sobre diminuição de gastos (positivo)
      if (pattern.trend === 'decreasing' && pattern.trendPercentage > 15) {
        insights.push({
          id: `spending-decrease-${pattern.categoryId}`,
          type: 'spending_pattern',
          title: `Parabéns! Economia em ${pattern.categoryName}`,
          description: `Você reduziu seus gastos com ${pattern.categoryName} em ${pattern.trendPercentage.toFixed(1)}%.`,
          impact: 'medium',
          category: pattern.categoryName,
          actionable: false,
          suggestions: [
            'Mantenha esse comportamento econômico',
            'Considere realocar essa economia para suas metas'
          ],
          data: {
            trend: pattern.trend,
            percentage: pattern.trendPercentage,
            avgAmount: pattern.avgMonthlySpending
          }
        });
      }

      // Insights de sazonalidade
      if (pattern.seasonality && pattern.seasonality.variation > 30) {
        const peakMonthName = format(new Date(2024, pattern.seasonality.peakMonth - 1), 'MMMM', { locale: ptBR });
        insights.push({
          id: `seasonality-${pattern.categoryId}`,
          type: 'spending_pattern',
          title: `Padrão sazonal em ${pattern.categoryName}`,
          description: `Seus gastos com ${pattern.categoryName} são maiores em ${peakMonthName}.`,
          impact: 'low',
          category: pattern.categoryName,
          actionable: true,
          suggestions: [
            `Planeje um orçamento maior para ${peakMonthName}`,
            'Considere criar uma reserva para os meses de maior gasto'
          ],
          data: pattern.seasonality
        });
      }
    });

    return insights;
  }

  /**
   * Identifica oportunidades de economia
   */
  private identifySavingsOpportunities(transactions: Transaction[], categories: Category[]): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const categoryMap = new Map(categories.map(cat => [cat._id!, cat]));

    // Calcular gastos por categoria nos últimos 3 meses
    const threeMonthsAgo = subMonths(new Date(), 3);
    const recentTransactions = transactions.filter(t => 
      t.type === 'expense' && new Date(t.date) >= threeMonthsAgo
    );

    const categorySpending = new Map<string, number>();
    recentTransactions.forEach(transaction => {
      const categoryId = typeof transaction.category === 'string' 
        ? transaction.category 
        : transaction.category._id!;
      
      const current = categorySpending.get(categoryId) || 0;
      categorySpending.set(categoryId, current + transaction.amount);
    });

    // Identificar categorias com maiores gastos (oportunidades de economia)
    const sortedSpending = Array.from(categorySpending.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3); // Top 3 categorias

    sortedSpending.forEach(([categoryId, totalSpent], index) => {
      const category = categoryMap.get(categoryId);
      if (!category) return;

      const monthlyAvg = totalSpent / 3;
      const potentialSaving = monthlyAvg * 0.15; // 15% de economia potencial

      insights.push({
        id: `savings-opportunity-${categoryId}`,
        type: 'saving_opportunity',
        title: `Oportunidade: Economizar em ${category.name}`,
        description: `Você poderia economizar até ${potentialSaving.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por mês reduzindo gastos em ${category.name}.`,
        impact: index === 0 ? 'high' : 'medium',
        category: category.name,
        actionable: true,
        suggestions: [
          'Compare preços antes de comprar',
          'Procure alternativas mais baratas',
          'Defina um limite mensal para esta categoria',
          'Avalie se todos os gastos são necessários'
        ],
        data: {
          currentMonthlyAvg: monthlyAvg,
          potentialSaving,
          totalSpent
        }
      });
    });

    return insights;
  }

  /**
   * Analisa tendências gerais dos gastos
   */
  private analyzeTrends(transactions: Transaction[], categories: Category[]): FinancialInsight[] {
    const insights: FinancialInsight[] = [];

    // Analisar tendência geral de gastos vs receitas
    const monthlyData = this.getMonthlyData(transactions);
    
    if (monthlyData.length >= 3) {
      const recentMonths = monthlyData.slice(-3);
      const balanceTrend = this.calculateTrend(recentMonths.map(m => m.balance));

      if (balanceTrend.direction === 'decreasing' && balanceTrend.percentage > 10) {
        insights.push({
          id: 'balance-trend-warning',
          type: 'trend_analysis',
          title: 'Saldo mensal em declínio',
          description: `Seu saldo mensal tem diminuído ${balanceTrend.percentage.toFixed(1)}% nos últimos meses.`,
          impact: 'high',
          actionable: true,
          suggestions: [
            'Revise seus gastos mensais',
            'Procure fontes de renda adicional',
            'Crie um plano para reduzir despesas desnecessárias'
          ],
          data: {
            trend: balanceTrend,
            recentBalances: recentMonths.map(m => m.balance)
          }
        });
      }

      // Análise de volatilidade
      const expenseVolatility = this.calculateVolatility(recentMonths.map(m => m.expenses));
      if (expenseVolatility > 30) {
        insights.push({
          id: 'expense-volatility',
          type: 'trend_analysis',
          title: 'Gastos instáveis detectados',
          description: 'Seus gastos mensais têm variado muito. Isso pode indicar falta de controle orçamentário.',
          impact: 'medium',
          actionable: true,
          suggestions: [
            'Crie um orçamento mensal fixo',
            'Monitore gastos semanalmente',
            'Identifique e controle gastos impulsivos'
          ],
          data: { volatility: expenseVolatility }
        });
      }
    }

    return insights;
  }

  /**
   * Analisa progresso das metas
   */
  private analyzeGoalProgress(goals: Goal[], transactions: Transaction[]): FinancialInsight[] {
    const insights: FinancialInsight[] = [];

    goals.forEach(goal => {
      if (goal.isCompleted) return;

      const progressPercentage = goal.targetAmount > 0 
        ? (goal.currentAmount / goal.targetAmount) * 100 
        : 0;

      // Meta com progresso lento
      if (progressPercentage < 25 && goal.deadline) {
        const deadline = new Date(goal.deadline);
        const now = new Date();
        const monthsLeft = differenceInMonths(deadline, now);
        
        if (monthsLeft <= 6 && monthsLeft > 0) {
          const requiredMonthly = (goal.targetAmount - goal.currentAmount) / monthsLeft;
          
          insights.push({
            id: `goal-behind-schedule-${goal._id}`,
            type: 'goal_suggestion',
            title: `Meta "${goal.title}" pode não ser alcançada`,
            description: `Para atingir sua meta até o prazo, você precisa poupar ${requiredMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por mês.`,
            impact: 'high',
            actionable: true,
            suggestions: [
              `Aumente a contribuição mensal para ${requiredMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
              'Revise o prazo da meta',
              'Procure fontes de renda adicional',
              'Reduza gastos desnecessários'
            ],
            data: {
              currentProgress: progressPercentage,
              requiredMonthly,
              monthsLeft
            }
          });
        }
      }

      // Meta próxima da conclusão
      if (progressPercentage >= 80 && progressPercentage < 100) {
        const remaining = goal.targetAmount - goal.currentAmount;
        insights.push({
          id: `goal-almost-complete-${goal._id}`,
          type: 'goal_suggestion',
          title: `Meta "${goal.title}" quase concluída!`,
          description: `Faltam apenas ${remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para atingir sua meta.`,
          impact: 'medium',
          actionable: true,
          suggestions: [
            'Faça um esforço extra este mês',
            'Considere usar parte da reserva de emergência',
            'Venda itens desnecessários'
          ],
          data: {
            progress: progressPercentage,
            remaining
          }
        });
      }
    });

    return insights;
  }

  /**
   * Gera previsões de gastos
   */
  private generatePredictions(transactions: Transaction[], categories: Category[]): PredictionResult {
    const monthlyData = this.getMonthlyData(transactions);
    
    if (monthlyData.length < 3) {
      return {
        nextMonthSpending: 0,
        confidence: 0,
        breakdown: []
      };
    }

    // Usar média dos últimos 3 meses com peso maior para o mês mais recente
    const recentData = monthlyData.slice(-3);
    const weights = [0.2, 0.3, 0.5]; // Mais peso para o mês mais recente
    
    const weightedAverage = recentData.reduce((sum, data, index) => {
      return sum + (data.expenses * weights[index]);
    }, 0);

    // Previsão por categoria
    const categoryPredictions = this.predictCategorySpending(transactions, categories);

    return {
      nextMonthSpending: weightedAverage,
      confidence: this.calculatePredictionConfidence(recentData),
      breakdown: categoryPredictions
    };
  }

  /**
   * Gera insights baseados nas previsões
   */
  private generatePredictionInsights(prediction: PredictionResult): FinancialInsight[] {
    const insights: FinancialInsight[] = [];

    if (prediction.confidence >= 0.7) {
      insights.push({
        id: 'spending-prediction',
        type: 'trend_analysis',
        title: 'Previsão de gastos do próximo mês',
        description: `Baseado no seu histórico, você provavelmente gastará ${prediction.nextMonthSpending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} no próximo mês.`,
        impact: 'medium',
        actionable: true,
        suggestions: [
          'Use essa previsão para planejar seu orçamento',
          'Prepare-se financeiramente para os gastos previstos',
          'Identifique oportunidades de redução'
        ],
        data: {
          prediction: prediction.nextMonthSpending,
          confidence: prediction.confidence,
          breakdown: prediction.breakdown
        }
      });
    }

    return insights;
  }

  /**
   * Gera alertas personalizados
   */
  private generatePersonalizedAlerts(
    transactions: Transaction[], 
    categories: Category[], 
    goals: Goal[]
  ): FinancialInsight[] {
    const insights: FinancialInsight[] = [];
    const currentMonth = new Date();
    const startMonth = startOfMonth(currentMonth);
    const endMonth = endOfMonth(currentMonth);

    // Transações do mês atual
    const thisMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= startMonth && date <= endMonth;
    });

    const thisMonthExpenses = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Alerta se gastos do mês estão muito altos comparado à média
    const avgMonthlyExpenses = this.calculateAverageMonthlyExpenses(transactions);
    
    if (thisMonthExpenses > avgMonthlyExpenses * 1.2) {
      insights.push({
        id: 'high-spending-alert',
        type: 'budget_warning',
        title: 'Gastos acima da média este mês',
        description: `Você já gastou ${thisMonthExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} este mês, 20% acima da sua média mensal.`,
        impact: 'high',
        actionable: true,
        suggestions: [
          'Revise seus gastos do mês',
          'Evite compras desnecessárias até o fim do mês',
          'Identifique o que causou o aumento'
        ],
        data: {
          thisMonthExpenses,
          avgMonthlyExpenses,
          difference: thisMonthExpenses - avgMonthlyExpenses
        }
      });
    }

    return insights;
  }

  // Métodos auxiliares
  private calculateTrend(values: number[]): { direction: 'increasing' | 'decreasing' | 'stable', percentage: number } {
    if (values.length < 2) return { direction: 'stable', percentage: 0 };

    const first = values[0];
    const last = values[values.length - 1];
    const percentage = first !== 0 ? Math.abs((last - first) / first) * 100 : 0;

    if (percentage < 5) return { direction: 'stable', percentage };
    
    return {
      direction: last > first ? 'increasing' : 'decreasing',
      percentage
    };
  }

  private detectSeasonality(monthData: Map<string, number>): { peakMonth: number, lowMonth: number, variation: number } {
    const monthlyAmounts = Array.from(monthData.entries())
      .map(([monthKey, amount]) => ({
        month: parseInt(monthKey.split('-')[1]),
        amount
      }));

    const monthAvgs = new Map<number, number[]>();
    monthlyAmounts.forEach(({ month, amount }) => {
      if (!monthAvgs.has(month)) monthAvgs.set(month, []);
      monthAvgs.get(month)!.push(amount);
    });

    const monthlyAverages = Array.from(monthAvgs.entries())
      .map(([month, amounts]) => ({
        month,
        avg: amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length
      }))
      .sort((a, b) => b.avg - a.avg);

    const peak = monthlyAverages[0];
    const low = monthlyAverages[monthlyAverages.length - 1];
    const variation = low.avg !== 0 ? ((peak.avg - low.avg) / low.avg) * 100 : 0;

    return {
      peakMonth: peak.month,
      lowMonth: low.month,
      variation
    };
  }

  private getMonthlyData(transactions: Transaction[]): Array<{ month: string, income: number, expenses: number, balance: number }> {
    const monthlyData = new Map<string, { income: number, expenses: number }>();

    transactions.forEach(transaction => {
      const monthKey = format(new Date(transaction.date), 'yyyy-MM');
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { income: 0, expenses: 0 });
      }
      
      const data = monthlyData.get(monthKey)!;
      if (transaction.type === 'income') {
        data.income += transaction.amount;
      } else {
        data.expenses += transaction.amount;
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        balance: data.income - data.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    return mean !== 0 ? (standardDeviation / mean) * 100 : 0;
  }

  private predictCategorySpending(transactions: Transaction[], categories: Category[]): Array<{ categoryId: string, categoryName: string, predictedAmount: number }> {
    const categoryMap = new Map(categories.map(cat => [cat._id!, cat]));
    const lastThreeMonths = subMonths(new Date(), 3);
    
    const recentTransactions = transactions.filter(t => 
      t.type === 'expense' && new Date(t.date) >= lastThreeMonths
    );

    const categorySpending = new Map<string, number[]>();
    
    // Agrupar por categoria e mês
    const monthlySpending = new Map<string, Map<string, number>>();
    
    recentTransactions.forEach(transaction => {
      const categoryId = typeof transaction.category === 'string' 
        ? transaction.category 
        : transaction.category._id!;
      
      const monthKey = format(new Date(transaction.date), 'yyyy-MM');
      
      if (!monthlySpending.has(categoryId)) {
        monthlySpending.set(categoryId, new Map());
      }
      
      const categoryData = monthlySpending.get(categoryId)!;
      const current = categoryData.get(monthKey) || 0;
      categoryData.set(monthKey, current + transaction.amount);
    });

    // Calcular previsões
    const predictions: Array<{ categoryId: string, categoryName: string, predictedAmount: number }> = [];
    
    monthlySpending.forEach((monthData, categoryId) => {
      const category = categoryMap.get(categoryId);
      if (!category) return;
      
      const amounts = Array.from(monthData.values());
      const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      
      predictions.push({
        categoryId,
        categoryName: category.name,
        predictedAmount: avgAmount
      });
    });

    return predictions.sort((a, b) => b.predictedAmount - a.predictedAmount);
  }

  private calculatePredictionConfidence(monthlyData: Array<{ expenses: number }>): number {
    const expenses = monthlyData.map(m => m.expenses);
    const volatility = this.calculateVolatility(expenses);
    
    // Confiança inversa à volatilidade
    return Math.max(0, Math.min(1, (100 - volatility) / 100));
  }

  private calculateAverageMonthlyExpenses(transactions: Transaction[]): number {
    const monthlyData = this.getMonthlyData(transactions);
    
    if (monthlyData.length === 0) return 0;
    
    const totalExpenses = monthlyData.reduce((sum, data) => sum + data.expenses, 0);
    return totalExpenses / monthlyData.length;
  }
}

export default AIInsightsService.getInstance();