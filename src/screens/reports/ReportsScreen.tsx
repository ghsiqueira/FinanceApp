import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Transaction } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemedView, ThemedText, ThemedCard, StatCard } from '../../components/ThemedComponents';

const screenWidth = Dimensions.get('window').width;

interface MonthlyData {
  income: number;
  expense: number;
}

interface CategoryData {
  [key: string]: number;
}

const ReportsScreen = () => {
  const { theme, isDark } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedChart, setSelectedChart] = useState<'overview' | 'categories' | 'trends'>('overview');

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data;
    }
  });

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 134, 171, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(51, 51, 51, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary
    },
    fillShadowGradient: theme.colors.primary,
    fillShadowGradientOpacity: 0.3,
  };

  const getFilteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (selectedPeriod) {
      case 'month':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 12);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 2);
        break;
    }

    return transactions.filter(t => new Date(t.date) >= startDate);
  }, [transactions, selectedPeriod]);

  const monthlyData = useMemo(() => {
    const months: { [key: string]: MonthlyData } = {};
    getFilteredTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { income: 0, expense: 0 };
      }
      
      if (transaction.type === 'income') {
        months[monthKey].income += transaction.amount;
      } else {
        months[monthKey].expense += transaction.amount;
      }
    });

    const sortedMonths = Object.keys(months).sort().slice(-6);
    
    return {
      labels: sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return monthNames[parseInt(monthNum) - 1];
      }),
      datasets: [
        {
          data: sortedMonths.map(month => months[month]?.income || 0),
          color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: sortedMonths.map(month => months[month]?.expense || 0),
          color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
          strokeWidth: 3,
        }
      ],
      legend: ['Receitas', 'Despesas']
    };
  }, [getFilteredTransactions]);

  const categoryData = useMemo(() => {
    const categories: CategoryData = {};
    const expenseTransactions = getFilteredTransactions.filter(t => t.type === 'expense');
    
    expenseTransactions.forEach(transaction => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = 0;
      }
      categories[transaction.category] += transaction.amount;
    });

    const colors = [
      '#FF6B8A', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    return Object.entries(categories)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 6)
      .map(([name, amount], index) => ({
        name: name.length > 8 ? name.substring(0, 8) + '...' : name,
        population: Number(amount),
        color: colors[index % colors.length],
        legendFontColor: isDark ? '#FFFFFF' : '#333333',
        legendFontSize: 12,
      }));
  }, [getFilteredTransactions, isDark]);

  const totals = useMemo(() => {
    const totalIncome = getFilteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = getFilteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
    
    return { totalIncome, totalExpenses, balance, savingsRate };
  }, [getFilteredTransactions]);

  const periodOptions = [
    { key: 'month', label: '6 Meses', icon: 'calendar' },
    { key: 'quarter', label: '1 Ano', icon: 'calendar' },
    { key: 'year', label: '2 Anos', icon: 'calendar' }
  ];

  const chartOptions = [
    { key: 'overview', label: 'Visão Geral', icon: 'analytics' },
    { key: 'categories', label: 'Categorias', icon: 'pie-chart' },
    { key: 'trends', label: 'Tendências', icon: 'trending-up' }
  ];

  const renderPeriodSelector = () => (
    <View style={styles.selectorContainer}>
      {periodOptions.map(option => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.selectorButton,
            selectedPeriod === option.key && [styles.selectorButtonActive, { backgroundColor: theme.colors.primary }]
          ]}
          onPress={() => setSelectedPeriod(option.key as any)}
        >
          <Ionicons 
            name={option.icon as any} 
            size={16} 
            color={selectedPeriod === option.key ? '#FFFFFF' : theme.colors.textSecondary} 
          />
          <ThemedText 
            variant="caption" 
            color={selectedPeriod === option.key ? 'text' : 'textSecondary'}
            style={{
              ...styles.selectorText,
              ...(selectedPeriod === option.key && { color: '#FFFFFF', fontWeight: '600' })
            }}
          >
            {option.label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChartSelector = () => (
    <View style={styles.chartSelectorContainer}>
      {chartOptions.map(option => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.chartSelectorButton,
            selectedChart === option.key && [styles.chartSelectorActive, { backgroundColor: `${theme.colors.primary}15`, borderColor: theme.colors.primary }]
          ]}
          onPress={() => setSelectedChart(option.key as any)}
        >
          <Ionicons 
            name={option.icon as any} 
            size={18} 
            color={selectedChart === option.key ? theme.colors.primary : theme.colors.textSecondary} 
          />
          <ThemedText 
            variant="caption" 
            color={selectedChart === option.key ? 'primary' : 'textSecondary'}
            style={{ marginTop: 4, fontWeight: selectedChart === option.key ? '600' : '400' }}
          >
            {option.label}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChart = () => {
    if (selectedChart === 'overview' && monthlyData.labels.length > 0) {
      return (
        <ThemedCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <ThemedText variant="subtitle" color="text" style={{ fontWeight: '600' }}>
              Receitas vs Despesas
            </ThemedText>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: 'rgba(39, 174, 96, 1)' }]} />
                <ThemedText variant="caption" color="textSecondary">Receitas</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: 'rgba(231, 76, 60, 1)' }]} />
                <ThemedText variant="caption" color="textSecondary">Despesas</ThemedText>
              </View>
            </View>
          </View>
          
          <LineChart
            data={monthlyData}
            width={screenWidth - 80}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withDots={true}
            withShadow={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            segments={4}
          />
        </ThemedCard>
      );
    }

    if (selectedChart === 'categories' && categoryData.length > 0) {
      return (
        <ThemedCard style={styles.chartCard}>
          <ThemedText variant="subtitle" color="text" style={{ fontWeight: '600', textAlign: 'center', marginBottom: 20 }}>
            🏷️ Gastos por Categoria
          </ThemedText>
          <PieChart
            data={categoryData}
            width={screenWidth - 80}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
            absolute
            hasLegend={true}
          />
        </ThemedCard>
      );
    }

    if (selectedChart === 'trends' && monthlyData.labels.length > 0) {
      const trendData = {
        labels: monthlyData.labels,
        datasets: [{
          data: monthlyData.labels.map((_, index) => {
            const income = monthlyData.datasets[0].data[index] || 0;
            const expense = monthlyData.datasets[1].data[index] || 0;
            return Math.max(0, income - expense); // Evitar valores negativos
          })
        }]
      };

      return (
        <ThemedCard style={styles.chartCard}>
          <ThemedText variant="subtitle" color="text" style={{ fontWeight: '600', textAlign: 'center', marginBottom: 20 }}>
            📊 Evolução do Saldo Positivo
          </ThemedText>
          <BarChart
            data={trendData}
            width={screenWidth - 80}
            height={200}
            yAxisLabel="R$ "
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(39, 174, 96, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars={false}
            withHorizontalLabels={true}
            segments={4}
          />
        </ThemedCard>
      );
    }

    return (
      <ThemedCard style={styles.emptyChartCard}>
        <Ionicons name="analytics-outline" size={64} color={theme.colors.textSecondary} />
        <ThemedText variant="body" color="textSecondary" style={{ marginTop: 16, textAlign: 'center' }}>
          Dados insuficientes
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: 4 }}>
          Adicione mais transações para ver os gráficos
        </ThemedText>
      </ThemedCard>
    );
  };

  const renderInsights = () => {
    const insights = [];
    
    if (totals.savingsRate > 20) {
      insights.push({
        icon: 'trophy',
        color: theme.colors.success,
        title: 'Parabéns! 🎉',
        description: `Taxa de poupança excelente: ${totals.savingsRate.toFixed(1)}%`
      });
    } else if (totals.savingsRate > 0) {
      insights.push({
        icon: 'trending-up',
        color: theme.colors.warning,
        title: 'Bom progresso 📈',
        description: `Continue assim! Taxa atual: ${totals.savingsRate.toFixed(1)}%`
      });
    } else {
      insights.push({
        icon: 'warning',
        color: theme.colors.error,
        title: 'Atenção! ⚠️',
        description: 'Você está gastando mais do que ganha'
      });
    }

    if (categoryData.length > 0) {
      const topCategory = categoryData[0];
      const percentage = ((topCategory.population / totals.totalExpenses) * 100);
      insights.push({
        icon: 'pie-chart',
        color: theme.colors.primary,
        title: 'Maior Gasto 💰',
        description: `${topCategory.name.replace('...', '')}: ${percentage.toFixed(0)}% dos gastos`
      });
    }

    const dailyAvg = getFilteredTransactions.length / 30;
    if (dailyAvg > 2) {
      insights.push({
        icon: 'flash',
        color: theme.colors.warning,
        title: 'Muito ativo! ⚡',
        description: `${dailyAvg.toFixed(1)} transações por dia`
      });
    }

    if (insights.length === 0) {
      insights.push({
        icon: 'information-circle',
        color: theme.colors.primary,
        title: 'Comece agora! 🚀',
        description: 'Adicione mais transações para insights personalizados'
      });
    }

    return (
      <View style={styles.insightsContainer}>
        <ThemedText variant="subtitle" color="text" style={styles.sectionTitle}>
          💡 Insights Personalizados
        </ThemedText>
        {insights.map((insight, index) => (
          <ThemedCard key={index} style={styles.insightCard}>
            <View style={[styles.insightIconContainer, { backgroundColor: `${insight.color}15` }]}>
              <Ionicons name={insight.icon as any} size={24} color={insight.color} />
            </View>
            <View style={styles.insightContent}>
              <ThemedText variant="body" color="text" style={{ fontWeight: '600', marginBottom: 2 }}>
                {insight.title}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                {insight.description}
              </ThemedText>
            </View>
          </ThemedCard>
        ))}
      </View>
    );
  };

  return (
    <ThemedView level="background" style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView level="surface" style={styles.header}>
          <ThemedText variant="title" color="text" style={{ fontWeight: 'bold' }}>
            📊 Relatórios
          </ThemedText>
          {renderPeriodSelector()}
        </ThemedView>

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <View style={styles.statsRow}>
            <StatCard
              title="Receitas"
              value={`R$ ${totals.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon="trending-up"
              color={theme.colors.success}
            />
            <StatCard
              title="Gastos" 
              value={`R$ ${totals.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon="trending-down"
              color={theme.colors.error}
            />
          </View>
          
          <ThemedCard style={styles.savingsCard}>
            <View style={styles.savingsHeader}>
              <View style={[styles.savingsIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                <Ionicons name="wallet" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.savingsInfo}>
                <ThemedText variant="caption" color="textSecondary">Taxa de Poupança</ThemedText>
                <ThemedText variant="title" color="primary" style={{ fontWeight: 'bold' }}>
                  {totals.savingsRate.toFixed(1)}%
                </ThemedText>
              </View>
              <View style={styles.savingsIndicator}>
                <View 
                  style={{
                    backgroundColor: theme.colors.border,
                    width: 60,
                    height: 6,
                    borderRadius: 3,
                  }}
                >
                  <View 
                    style={{
                      width: `${Math.min(Math.max(totals.savingsRate, 0), 100)}%`,
                      backgroundColor: totals.savingsRate > 20 ? theme.colors.success : 
                                     totals.savingsRate > 0 ? theme.colors.warning : theme.colors.error,
                      height: '100%',
                      borderRadius: 3,
                    }} 
                  />
                </View>
              </View>
            </View>
          </ThemedCard>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          {renderChartSelector()}
          {renderChart()}
        </View>

        {/* Insights */}
        {renderInsights()}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  selectorButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summarySection: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  savingsCard: {
    padding: 20,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  savingsInfo: {
    flex: 1,
  },
  savingsIndicator: {
    alignItems: 'flex-end',
  },
  chartSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chartSelectorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chartSelectorButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chartSelectorActive: {
    borderWidth: 1,
  },
  chartCard: {
    padding: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chart: {
    borderRadius: 12,
  },
  emptyChartCard: {
    padding: 60,
    alignItems: 'center',
  },
  insightsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
});

export default ReportsScreen;