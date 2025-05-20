// src/screens/EnhancedReports.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionContext';
import { Transaction, Category } from '../types';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MonthSelector from '../components/MonthSelector';
import PieChart from '../components/PieChart';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import { formatCurrency } from '../utils/formatters';
import cacheManager from '../utils/cacheManager';

// Interface para categorias agrupadas (para o gráfico de pizza)
interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

const EnhancedReports = () => {
  const { theme } = useTheme();
  const { transactions, fetchTransactions } = useTransactions();
  
  // Selected date state
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Period selector
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  
  // Loading state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Chart data
  const [expenseSummaries, setExpenseSummaries] = useState<CategorySummary[]>([]);
  const [incomeSummaries, setIncomeSummaries] = useState<CategorySummary[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyData[]>([]);
  
  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    await processData();
    setRefreshing(false);
  };
  
  // Process transaction data for charts
  const processData = async () => {
    setLoading(true);
    
    try {
      // Try to get data from cache first
      const cacheKey = `reports_${selectedDate.toISOString()}_${period}`;
      const cachedData = await cacheManager.getItem<{
        expenses: CategorySummary[];
        incomes: CategorySummary[];
        trends: MonthlyData[];
      }>(cacheKey);
      
      if (cachedData) {
        setExpenseSummaries(cachedData.expenses);
        setIncomeSummaries(cachedData.incomes);
        setMonthlyTrends(cachedData.trends);
        setLoading(false);
        return;
      }
      
      // Filter transactions based on selected period
      let filteredTransactions: Transaction[] = [];
      let startDate: Date;
      let endDate = endOfMonth(selectedDate);
      
      switch (period) {
        case 'month':
          startDate = startOfMonth(selectedDate);
          break;
        case 'quarter':
          startDate = startOfMonth(subMonths(selectedDate, 2));
          break;
        case 'year':
          startDate = startOfMonth(subMonths(selectedDate, 11));
          break;
      }
      
      filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(
          typeof transaction.date === 'string'
            ? transaction.date
            : transaction.date.toString()
        );
        
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      
      // Calculate category summaries
      const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
      const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');
      
      const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Process expense categories
      const expenseCategorySummaries: Record<string, CategorySummary> = {};
      
      expenseTransactions.forEach(transaction => {
        const category = typeof transaction.category === 'object' ? transaction.category : null;
        if (!category) return;
        
        const categoryId = category._id || '';
        
        if (!expenseCategorySummaries[categoryId]) {
          expenseCategorySummaries[categoryId] = {
            categoryId,
            categoryName: category.name,
            categoryColor: category.color,
            categoryIcon: category.icon,
            amount: 0,
            percentage: 0
          };
        }
        
        expenseCategorySummaries[categoryId].amount += transaction.amount;
      });
      
      // Calculate percentages for expenses
      Object.values(expenseCategorySummaries).forEach(summary => {
        summary.percentage = totalExpense > 0 ? (summary.amount / totalExpense) * 100 : 0;
      });
      
      // Process income categories
      const incomeCategorySummaries: Record<string, CategorySummary> = {};
      
      incomeTransactions.forEach(transaction => {
        const category = typeof transaction.category === 'object' ? transaction.category : null;
        if (!category) return;
        
        const categoryId = category._id || '';
        
        if (!incomeCategorySummaries[categoryId]) {
          incomeCategorySummaries[categoryId] = {
            categoryId,
            categoryName: category.name,
            categoryColor: category.color,
            categoryIcon: category.icon,
            amount: 0,
            percentage: 0
          };
        }
        
        incomeCategorySummaries[categoryId].amount += transaction.amount;
      });
      
      // Calculate percentages for incomes
      Object.values(incomeCategorySummaries).forEach(summary => {
        summary.percentage = totalIncome > 0 ? (summary.amount / totalIncome) * 100 : 0;
      });
      
      // Generate monthly trends data
      const trends: MonthlyData[] = [];
      
      // For month view: show daily data
      // For quarter/year: show monthly data
      if (period === 'month') {
        // Group by day of month
        const daysInMonth = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth() + 1,
          0
        ).getDate();
        
        // Initialize days array
        for (let day = 1; day <= daysInMonth; day++) {
          const dayDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            day
          );
          
          if (dayDate > new Date()) {
            // Don't show future dates
            break;
          }
          
          trends.push({
            month: day.toString(), // Using month for day in this case
            income: 0,
            expense: 0,
            balance: 0
          });
        }
        
        // Populate with transaction data
        filteredTransactions.forEach(transaction => {
          const transactionDate = new Date(
            typeof transaction.date === 'string'
              ? transaction.date
              : transaction.date.toString()
          );
          
          const day = transactionDate.getDate();
          
          if (day <= trends.length) {
            if (transaction.type === 'income') {
              trends[day - 1].income += transaction.amount;
            } else {
              trends[day - 1].expense += transaction.amount;
            }
            
            trends[day - 1].balance = trends[day - 1].income - trends[day - 1].expense;
          }
        });
      } else {
        // For quarter/year: group by month
        const monthCount = period === 'quarter' ? 3 : 12;
        
        for (let i = 0; i < monthCount; i++) {
          const monthDate = subMonths(selectedDate, monthCount - i - 1);
          
          trends.push({
            month: format(monthDate, 'MMM', { locale: ptBR }),
            income: 0,
            expense: 0,
            balance: 0
          });
          
          // Populate with transaction data
          filteredTransactions.forEach(transaction => {
            const transactionDate = new Date(
              typeof transaction.date === 'string'
                ? transaction.date
                : transaction.date.toString()
            );
            
            // Check if transaction is in this month
            if (
              transactionDate.getMonth() === monthDate.getMonth() &&
              transactionDate.getFullYear() === monthDate.getFullYear()
            ) {
              if (transaction.type === 'income') {
                trends[i].income += transaction.amount;
              } else {
                trends[i].expense += transaction.amount;
              }
              
              trends[i].balance = trends[i].income - trends[i].expense;
            }
          });
        }
      }
      
      // Sort summaries by amount
      const sortedExpenseSummaries = Object.values(expenseCategorySummaries).sort(
        (a, b) => b.amount - a.amount
      );
      
      const sortedIncomeSummaries = Object.values(incomeCategorySummaries).sort(
        (a, b) => b.amount - a.amount
      );
      
      // Update state
      setExpenseSummaries(sortedExpenseSummaries);
      setIncomeSummaries(sortedIncomeSummaries);
      setMonthlyTrends(trends);
      
      // Cache data
      await cacheManager.setItem(cacheKey, {
        expenses: sortedExpenseSummaries,
        incomes: sortedIncomeSummaries,
        trends
      }, 60 * 60 * 1000); // 1 hour cache
      
    } catch (error) {
      console.error('Error processing data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Prepare data for pie charts
  const preparePieChartData = (summaries: CategorySummary[]) => {
    // Only show top 5 categories, group others into "Others"
    const topCategories = summaries.slice(0, 5);
    
    const otherCategories = summaries.slice(5);
    const otherAmount = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);
    
    const pieData = topCategories.map(cat => ({
      name: cat.categoryName,
      value: cat.amount,
      color: cat.categoryColor,
      legendFontColor: theme.text,
      legendFontSize: 12
    }));
    
    // Add "Others" if there are more than 5 categories
    if (otherCategories.length > 0) {
      pieData.push({
        name: 'Outros',
        value: otherAmount,
        color: '#999999',
        legendFontColor: theme.text,
        legendFontSize: 12
      });
    }
    
    return pieData;
  };
  
  // Prepare data for line chart
  const prepareLineChartData = () => {
    return {
      labels: monthlyTrends.map(data => data.month),
      datasets: [
        {
          data: monthlyTrends.map(data => data.income),
          color: () => theme.success,
          strokeWidth: 2
        },
        {
          data: monthlyTrends.map(data => data.expense),
          color: () => theme.error,
          strokeWidth: 2
        },
        {
          data: monthlyTrends.map(data => data.balance),
          color: () => theme.primary,
          strokeWidth: 2
        }
      ],
      legend: ['Receitas', 'Despesas', 'Saldo']
    };
  };
  
  // Prepare data for bar chart
  const prepareBarChartData = () => {
    return {
      labels: monthlyTrends.map(data => data.month),
      datasets: [
        {
          data: monthlyTrends.map(data => data.balance),
          colors: monthlyTrends.map(data => 
            data.balance >= 0 ? theme.success : theme.error
          )
        }
      ]
    };
  };
  
  // Load data when mounted or date/period changes
  useEffect(() => {
    processData();
  }, [selectedDate, period, transactions]);
  
  // Format currency for chart labels
  const formatCurrencyLabel = (value: string) => {
    const numValue = parseFloat(value);
    return formatCurrency(numValue);
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.primary]}
          tintColor={theme.primary}
        />
      }
    >
      {/* Month Selector */}
      <MonthSelector
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />
      
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodOption,
            period === 'month' && { 
              backgroundColor: theme.primary,
              borderColor: theme.primary 
            },
            { borderColor: theme.border }
          ]}
          onPress={() => setPeriod('month')}
        >
          <Text
            style={[
              styles.periodText,
              { color: period === 'month' ? '#fff' : theme.text }
            ]}
          >
            Mês
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.periodOption,
            period === 'quarter' && { 
              backgroundColor: theme.primary,
              borderColor: theme.primary 
            },
            { borderColor: theme.border }
          ]}
          onPress={() => setPeriod('quarter')}
        >
          <Text
            style={[
              styles.periodText,
              { color: period === 'quarter' ? '#fff' : theme.text }
            ]}
          >
            Trimestre
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.periodOption,
            period === 'year' && { 
              backgroundColor: theme.primary,
              borderColor: theme.primary 
            },
            { borderColor: theme.border }
          ]}
          onPress={() => setPeriod('year')}
        >
          <Text
            style={[
              styles.periodText,
              { color: period === 'year' ? '#fff' : theme.text }
            ]}
          >
            Ano
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <>
          {/* Trends Chart */}
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Tendências de {period === 'month' ? 'Dias' : 'Meses'}
            </Text>
            
            {monthlyTrends.length > 0 ? (
              <LineChart
                data={prepareLineChartData()}
                height={220}
                formatYLabel={formatCurrencyLabel}
              />
            ) : (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhum dado disponível para este período
              </Text>
            )}
          </View>
          
          {/* Balance Chart */}
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Saldo por {period === 'month' ? 'Dia' : 'Mês'}
            </Text>
            
            {monthlyTrends.length > 0 ? (
              <BarChart
                data={prepareBarChartData()}
                height={220}
                formatYLabel={formatCurrencyLabel}
              />
            ) : (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhum dado disponível para este período
              </Text>
            )}
          </View>
          
          {/* Expense Chart */}
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Despesas por Categoria
            </Text>
            
            {expenseSummaries.length > 0 ? (
              <PieChart
                data={preparePieChartData(expenseSummaries)}
                height={220}
                accessor="value"
              />
            ) : (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhuma despesa no período selecionado
              </Text>
            )}
            
            {/* Category List */}
            {expenseSummaries.length > 0 && (
              <View style={styles.categoryList}>
                {expenseSummaries.map((summary) => (
                  <View key={summary.categoryId} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <View style={[
                        styles.categoryIcon, 
                        { backgroundColor: summary.categoryColor + '20' }
                      ]}>
                        <Icon name={summary.categoryIcon} size={18} color={summary.categoryColor} />
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
                ))}
              </View>
            )}
          </View>
          
          {/* Income Chart */}
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Receitas por Categoria
            </Text>
            
            {incomeSummaries.length > 0 ? (
              <PieChart
                data={preparePieChartData(incomeSummaries)}
                height={220}
                accessor="value"
              />
            ) : (
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhuma receita no período selecionado
              </Text>
            )}
            
            {/* Category List */}
            {incomeSummaries.length > 0 && (
              <View style={styles.categoryList}>
                {incomeSummaries.map((summary) => (
                  <View key={summary.categoryId} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <View style={[
                        styles.categoryIcon, 
                        { backgroundColor: summary.categoryColor + '20' }
                      ]}>
                        <Icon name={summary.categoryIcon} size={18} color={summary.categoryColor} />
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
                ))}
              </View>
            )}
          </View>
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
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  periodOption: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodText: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
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
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
  },
  categoryList: {
    marginTop: 16,
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
});

export default EnhancedReports;