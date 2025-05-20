// src/screens/Reports.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionContext';
import { Transaction, Category } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MonthSelector from '../components/MonthSelector';
import { formatCurrency } from '../utils/formatters';

// Interface para categorias agrupadas (para o gráfico de pizza)
interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

const Reports = () => {
  const { theme } = useTheme();
  const { transactions, monthlySummary, fetchMonthlySummary } = useTransactions();
  
  // Selected date state
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Get current month and year
  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();
  
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
          
          {/* Note about future features */}
          <View style={styles.noteContainer}>
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
              Em breve: gráficos detalhados, exportação de relatórios e mais!
            </Text>
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
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
});

export default Reports;