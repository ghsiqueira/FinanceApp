// src/screens/Reports.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionContext';
import { Transaction, Category } from '../types';
import { format, subMonths, startOfMonth, endOfMonth, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MonthSelector from '../components/MonthSelector';
import { formatCurrency } from '../utils/formatters';
import BarChart from '../components/BarChart';
import LineChart from '../components/LineChart';
import PieChart from '../components/PieChart';

// Interface para categorias agrupadas (para o gráfico de pizza)
interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

// Tipos de visualizações de gráficos disponíveis
type ChartView = 'summary' | 'charts' | 'details';

const Reports = () => {
  const { theme } = useTheme();
  const { transactions, monthlySummary, fetchMonthlySummary } = useTransactions();
  
  // Selected date state
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Chart view state
  const [chartView, setChartView] = useState<ChartView>('summary');

  // Active chart type
  const [activeChart, setActiveChart] = useState<'pie' | 'bar' | 'line'>('pie');
  
  // Get current month and year
  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();
  
  // Screen dimensions
  const screenWidth = Dimensions.get('window').width;
  
  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Fetch data when month changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchMonthlySummary(currentYear, currentMonth);
      setLoading(false);
    };
    
    loadData();
  }, [currentMonth, currentYear]);
  
  // Calculate category summaries for expenses
  const calculateExpenseSummaries = (): CategorySummary[] => {
    if (!monthlySummary) return [];
    
    const expenseTransactions = monthlySummary.transactions.filter(t => t.type === 'expense');
    const totalExpense = monthlySummary.expense;
    
    if (totalExpense === 0) return [];
    
    // Group by category
    const categorySummaries: Record<string, CategorySummary> = {};
    
    expenseTransactions.forEach(transaction => {
      const category = typeof transaction.category === 'object' ? transaction.category : null;
      if (!category) return;
      
      const categoryId = category._id || '';
      
      if (!categorySummaries[categoryId]) {
        categorySummaries[categoryId] = {
          categoryId,
          categoryName: category.name,
          categoryColor: category.color,
          categoryIcon: category.icon,
          amount: 0,
          percentage: 0
        };
      }
      
      categorySummaries[categoryId].amount += transaction.amount;
    });
    
    // Calculate percentages
    Object.values(categorySummaries).forEach(summary => {
      summary.percentage = (summary.amount / totalExpense) * 100;
    });
    
    // Sort by amount (descending)
    return Object.values(categorySummaries).sort((a, b) => b.amount - a.amount);
  };
  
  // Calculate category summaries for income
  const calculateIncomeSummaries = (): CategorySummary[] => {
    if (!monthlySummary) return [];
    
    const incomeTransactions = monthlySummary.transactions.filter(t => t.type === 'income');
    const totalIncome = monthlySummary.income;
    
    if (totalIncome === 0) return [];
    
    // Group by category
    const categorySummaries: Record<string, CategorySummary> = {};
    
    incomeTransactions.forEach(transaction => {
      const category = typeof transaction.category === 'object' ? transaction.category : null;
      if (!category) return;
      
      const categoryId = category._id || '';
      
      if (!categorySummaries[categoryId]) {
        categorySummaries[categoryId] = {
          categoryId,
          categoryName: category.name,
          categoryColor: category.color,
          categoryIcon: category.icon,
          amount: 0,
          percentage: 0
        };
      }
      
      categorySummaries[categoryId].amount += transaction.amount;
    });
    
    // Calculate percentages
    Object.values(categorySummaries).forEach(summary => {
      summary.percentage = (summary.amount / totalIncome) * 100;
    });
    
    // Sort by amount (descending)
    return Object.values(categorySummaries).sort((a, b) => b.amount - a.amount);
  };
  
  // Get expense and income summaries
  const expenseSummaries = calculateExpenseSummaries();
  const incomeSummaries = calculateIncomeSummaries();

  // Prepare data for charts
  const chartData = useMemo(() => {
    // PieChart data for expenses
    const expensePieData = expenseSummaries.map(summary => ({
      name: summary.categoryName,
      value: summary.amount,
      color: summary.categoryColor,
      legendFontColor: theme.text,
      legendFontSize: 12
    }));

    // PieChart data for income
    const incomePieData = incomeSummaries.map(summary => ({
      name: summary.categoryName,
      value: summary.amount,
      color: summary.categoryColor,
      legendFontColor: theme.text,
      legendFontSize: 12
    }));

    // Last 6 months data for BarChart and LineChart
    const lastMonths: { date: Date, label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(selectedDate, i);
      lastMonths.push({
        date: monthDate,
        label: format(monthDate, 'MMM', { locale: ptBR })
      });
    }
    
    // Get all transactions for the last 6 months
    const allTransactions = transactions || [];
    
    // Calculate income and expense per month
    const monthlyData = lastMonths.map(month => {
      const startDate = startOfMonth(month.date);
      const endDate = endOfMonth(month.date);
      const monthTransactions = allTransactions.filter(t => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate;
      });
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        month: month.label,
        income: monthIncome,
        expense: monthExpense,
        balance: monthIncome - monthExpense
      };
    });
    
    // BarChart data
    const barData = {
      labels: monthlyData.map(m => m.month),
      datasets: [
        {
          data: monthlyData.map(m => m.expense),
          colors: Array(monthlyData.length).fill(theme.error)
        }
      ]
    };
    
    // LineChart data
    const lineData = {
      labels: monthlyData.map(m => m.month),
      datasets: [
        {
          data: monthlyData.map(m => m.balance),
          color: () => theme.primary,
          strokeWidth: 2
        }
      ]
    };
    
    return {
      expensePie: expensePieData,
      incomePie: incomePieData,
      bar: barData,
      line: lineData
    };
  }, [expenseSummaries, incomeSummaries, transactions, selectedDate, theme]);

  const renderTabSelector = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          chartView === 'summary' && [styles.activeTab, { borderColor: theme.primary }]
        ]}
        onPress={() => setChartView('summary')}
      >
        <Text style={[
          styles.tabText,
          { color: chartView === 'summary' ? theme.primary : theme.textSecondary }
        ]}>
          Resumo
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tabButton,
          chartView === 'charts' && [styles.activeTab, { borderColor: theme.primary }]
        ]}
        onPress={() => setChartView('charts')}
      >
        <Text style={[
          styles.tabText,
          { color: chartView === 'charts' ? theme.primary : theme.textSecondary }
        ]}>
          Gráficos
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tabButton,
          chartView === 'details' && [styles.activeTab, { borderColor: theme.primary }]
        ]}
        onPress={() => setChartView('details')}
      >
        <Text style={[
          styles.tabText,
          { color: chartView === 'details' ? theme.primary : theme.textSecondary }
        ]}>
          Detalhes
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChartTypeSelector = () => (
    <View style={styles.chartTypeContainer}>
      <TouchableOpacity
        style={[
          styles.chartTypeButton,
          activeChart === 'pie' && { backgroundColor: theme.primary + '20' }
        ]}
        onPress={() => setActiveChart('pie')}
      >
        <Icon 
          name="chart-pie" 
          size={24} 
          color={activeChart === 'pie' ? theme.primary : theme.textSecondary} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.chartTypeButton,
          activeChart === 'bar' && { backgroundColor: theme.primary + '20' }
        ]}
        onPress={() => setActiveChart('bar')}
      >
        <Icon 
          name="chart-bar" 
          size={24} 
          color={activeChart === 'bar' ? theme.primary : theme.textSecondary} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.chartTypeButton,
          activeChart === 'line' && { backgroundColor: theme.primary + '20' }
        ]}
        onPress={() => setActiveChart('line')}
      >
        <Icon 
          name="chart-line" 
          size={24} 
          color={activeChart === 'line' ? theme.primary : theme.textSecondary} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderSummaryView = () => {
    // Garantir que monthlySummary não é nulo antes de acessá-lo
    if (!monthlySummary) return null;
    
    return (
      <>
        {/* Balance Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Resumo do Mês
          </Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Receitas
            </Text>
            <Text style={[styles.incomeValue, { color: theme.success }]}>
              {formatCurrency(monthlySummary.income)}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Despesas
            </Text>
            <Text style={[styles.expenseValue, { color: theme.error }]}>
              {formatCurrency(monthlySummary.expense)}
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.summaryRow}>
            <Text style={[styles.balanceLabel, { color: theme.text }]}>
              Saldo
            </Text>
            <Text style={[
              styles.balanceValue, 
              { 
                color: monthlySummary.balance >= 0 
                  ? theme.success 
                  : theme.error 
              }
            ]}>
              {formatCurrency(monthlySummary.balance)}
            </Text>
          </View>
        </View>
        
        {/* Expense Categories */}
        <View style={[styles.categorySummaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Despesas por Categoria
          </Text>
          
          {expenseSummaries.length === 0 ? (
            <Text style={[styles.emptyCategoryText, { color: theme.textSecondary }]}>
              Nenhuma despesa neste mês
            </Text>
          ) : (
            expenseSummaries.map(summary => (
              <View key={summary.categoryId} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[
                    styles.categoryIcon, 
                    { backgroundColor: summary.categoryColor + '20' }
                  ]}>
                    <Icon 
                      name={summary.categoryIcon} 
                      size={18} 
                      color={summary.categoryColor} 
                    />
                  </View>
                  <Text style={[styles.categoryName, { color: theme.text }]}>
                    {summary.categoryName}
                  </Text>
                </View>
                
                <View style={styles.categoryValues}>
                  <Text style={[styles.categoryAmount, { color: theme.text }]}>
                    {formatCurrency(summary.amount)}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: theme.textSecondary }]}>
                    {summary.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
        
        {/* Income Categories */}
        <View style={[styles.categorySummaryCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Receitas por Categoria
          </Text>
          
          {incomeSummaries.length === 0 ? (
            <Text style={[styles.emptyCategoryText, { color: theme.textSecondary }]}>
              Nenhuma receita neste mês
            </Text>
          ) : (
            incomeSummaries.map(summary => (
              <View key={summary.categoryId} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[
                    styles.categoryIcon, 
                    { backgroundColor: summary.categoryColor + '20' }
                  ]}>
                    <Icon 
                      name={summary.categoryIcon} 
                      size={18} 
                      color={summary.categoryColor} 
                    />
                  </View>
                  <Text style={[styles.categoryName, { color: theme.text }]}>
                    {summary.categoryName}
                  </Text>
                </View>
                
                <View style={styles.categoryValues}>
                  <Text style={[styles.categoryAmount, { color: theme.text }]}>
                    {formatCurrency(summary.amount)}
                  </Text>
                  <Text style={[styles.categoryPercentage, { color: theme.textSecondary }]}>
                    {summary.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </>
    );
  };

  const renderChartsView = () => (
    <>
      {renderChartTypeSelector()}
      
      <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
        {activeChart === 'pie' && (
          <>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Despesas por Categoria
            </Text>
            {chartData.expensePie.length > 0 ? (
              <PieChart
                data={chartData.expensePie}
                width={screenWidth - 60}
                height={220}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                hasLegend={true}
                centerText={formatCurrency(monthlySummary?.expense || 0)}
              />
            ) : (
              <Text style={[styles.emptyCategoryText, { color: theme.textSecondary }]}>
                Nenhuma despesa neste mês
              </Text>
            )}
            
            <View style={[styles.chartDivider, { backgroundColor: theme.border }]} />
            
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Receitas por Categoria
            </Text>
            {chartData.incomePie.length > 0 ? (
              <PieChart
                data={chartData.incomePie}
                width={screenWidth - 60}
                height={220}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                hasLegend={true}
                centerText={formatCurrency(monthlySummary?.income || 0)}
              />
            ) : (
              <Text style={[styles.emptyCategoryText, { color: theme.textSecondary }]}>
                Nenhuma receita neste mês
              </Text>
            )}
          </>
        )}
        
        {activeChart === 'bar' && (
          <>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Despesas nos Últimos 6 Meses
            </Text>
            <BarChart
              data={chartData.bar}
              width={screenWidth - 60}
              height={220}
              formatYLabel={(value) => `R$${parseInt(value) / 1000}K`}
              showValuesOnTopOfBars={true}
            />
          </>
        )}
        
        {activeChart === 'line' && (
          <>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Saldo nos Últimos 6 Meses
            </Text>
            <LineChart
              data={chartData.line}
              width={screenWidth - 60}
              height={220}
              formatYLabel={(value) => `R$${parseInt(value) / 1000}K`}
              bezier={true}
            />
          </>
        )}
      </View>
      
      <View style={styles.graphTipContainer}>
        <Text style={[styles.graphTipText, { color: theme.textSecondary }]}>
          Dica: Toque nos ícones acima para alternar entre diferentes tipos de gráficos.
        </Text>
      </View>
    </>
  );

  const renderDetailsView = () => {
    // Garantir que monthlySummary não é nulo antes de acessá-lo
    if (!monthlySummary) return null;
    
    return (
      <>
        <View style={[styles.detailsCard, { backgroundColor: theme.card }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>
            Detalhes Financeiros
          </Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Média de Gastos Diários
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {formatCurrency(monthlySummary.expense / 30)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Maior Categoria de Despesa
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {expenseSummaries.length > 0 
                ? expenseSummaries[0].categoryName 
                : 'Nenhuma'
              }
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Maior Categoria de Receita
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {incomeSummaries.length > 0 
                ? incomeSummaries[0].categoryName 
                : 'Nenhuma'
              }
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Razão Receita/Despesa
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {monthlySummary.expense 
                ? (monthlySummary.income / monthlySummary.expense).toFixed(2) 
                : 'N/A'
              }
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Total de Transações
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {monthlySummary.transactions.length || 0}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.exportButton, { backgroundColor: theme.primary }]}
          // Aqui você pode adicionar a função para exportar os relatórios
          onPress={() => {}}
        >
          <Icon name="file-export" size={20} color="#fff" style={styles.exportIcon} />
          <Text style={styles.exportButtonText}>
            Exportar Relatório
          </Text>
        </TouchableOpacity>
        
        <View style={styles.detailsNoteContainer}>
          <Text style={[styles.detailsNoteText, { color: theme.textSecondary }]}>
            Em desenvolvimento: relatórios personalizados, análise de tendências e previsões de gastos.
          </Text>
        </View>
      </>
    );
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Month Selector */}
      <MonthSelector
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />
      
      {/* Tab Selector */}
      {renderTabSelector()}
      
      {/* Summary Cards */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : !monthlySummary ? (
        <View style={styles.noDataContainer}>
          <Icon name="chart-arc" size={64} color={theme.textSecondary} />
          <Text style={[styles.noDataText, { color: theme.text }]}>
            Nenhum dado disponível para este mês
          </Text>
        </View>
      ) : (
        <>
          {chartView === 'summary' && renderSummaryView()}
          {chartView === 'charts' && renderChartsView()}
          {chartView === 'details' && renderDetailsView()}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noDataContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noDataText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontWeight: '500',
  },
  chartTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  chartTypeButton: {
    marginHorizontal: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categorySummaryCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  incomeValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  chartDivider: {
    height: 1,
    marginVertical: 16,
    width: '100%',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCategoryText: {
    textAlign: 'center',
    padding: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
  },
  categoryValues: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryPercentage: {
    fontSize: 12,
    marginTop: 2,
  },
  noteContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  graphTipContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  graphTipText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exportIcon: {
    marginRight: 8,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsNoteContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  detailsNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default Reports;
