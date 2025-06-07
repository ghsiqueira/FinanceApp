// src/screens/main/DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { RootState, AppDispatch } from '../../store/store';
import { fetchTransactions } from '../../store/slices/transactionSlice';
import { fetchBudgets } from '../../store/slices/budgetSlice';
import { fetchGoals } from '../../store/slices/goalSlice';
import { MainScreenProps } from '../../types/navigation';
import { Transaction, TransactionCategory } from '../../types';

const { width: screenWidth } = Dimensions.get('window');

type DashboardScreenProps = MainScreenProps<'Dashboard'>;

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { transactions, isLoading: transactionsLoading } = useSelector(
    (state: RootState) => state.transactions
  );
  const { budgets } = useSelector((state: RootState) => state.budgets);
  const { goals } = useSelector((state: RootState) => state.goals);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchTransactions()),
        dispatch(fetchBudgets()),
        dispatch(fetchGoals(undefined)),
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calcular resumo financeiro
  const getFinancialSummary = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    return { totalIncome, totalExpense, balance, monthlyTransactions };
  };

  // Dados para gráfico de gastos por categoria
  const getCategoryChartData = () => {
    const { monthlyTransactions } = getFinancialSummary();
    const expenses = monthlyTransactions.filter(t => t.type === 'expense');

    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(transaction => {
      categoryTotals[transaction.category] = 
        (categoryTotals[transaction.category] || 0) + transaction.amount;
    });

    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];

    return Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        name: getCategoryLabel(category as TransactionCategory),
        population: amount,
        color: colors[index % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }))
      .sort((a, b) => b.population - a.population)
      .slice(0, 6); // Top 6 categorias
  };

  // Dados para gráfico de linha (últimos 7 dias)
  const getWeeklyChartData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const dailyTotals = last7Days.map(date => {
      const dayTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.toDateString() === date.toDateString();
      });

      const expenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return expenses;
    });

    return {
      labels: last7Days.map(date => 
        date.toLocaleDateString('pt-BR', { weekday: 'short' })
      ),
      datasets: [{
        data: dailyTotals,
        strokeWidth: 2,
      }],
    };
  };

  const getCategoryLabel = (category: TransactionCategory): string => {
    const labels: { [key in TransactionCategory]: string } = {
      alimentacao: 'Alimentação',
      transporte: 'Transporte',
      moradia: 'Moradia',
      saude: 'Saúde',
      educacao: 'Educação',
      lazer: 'Lazer',
      vestuario: 'Vestuário',
      servicos: 'Serviços',
      investimentos: 'Investimentos',
      salario: 'Salário',
      freelance: 'Freelance',
      vendas: 'Vendas',
      outros: 'Outros',
    };
    return labels[category] || category;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const { totalIncome, totalExpense, balance } = getFinancialSummary();
  const categoryData = getCategoryChartData();
  const weeklyData = getWeeklyChartData();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name}! 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Icon name="person" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {/* Resumo Financeiro */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.balanceCard]}>
          <Text style={styles.summaryLabel}>Saldo do Mês</Text>
          <Text style={[styles.summaryValue, balance >= 0 ? styles.positive : styles.negative]}>
            {formatCurrency(balance)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Icon name="trending-up" size={20} color="#10B981" />
            <Text style={styles.summaryLabel}>Receitas</Text>
            <Text style={[styles.summaryValue, styles.positive]}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Icon name="trending-down" size={20} color="#EF4444" />
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={[styles.summaryValue, styles.negative]}>
              {formatCurrency(totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* Ações Rápidas */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddTransaction' as never)}
          >
            <Icon name="add" size={24} color="#6C63FF" />
            <Text style={styles.actionText}>Nova Transação</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Budget')}
          >
            <Icon name="pie-chart" size={24} color="#6C63FF" />
            <Text style={styles.actionText}>Orçamentos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Goals')}
          >
            <Icon name="flag" size={24} color="#6C63FF" />
            <Text style={styles.actionText}>Metas</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gráfico de Gastos Semanais */}
      {weeklyData.datasets[0].data.some(value => value > 0) && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Gastos dos Últimos 7 Dias</Text>
          <LineChart
            data={weeklyData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#6C63FF',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Gráfico de Categorias */}
      {categoryData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Gastos por Categoria</Text>
          <PieChart
            data={categoryData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </View>
      )}

      {/* Metas em Destaque */}
      {goals.length > 0 && (
        <View style={styles.goalsContainer}>
          <Text style={styles.sectionTitle}>Suas Metas</Text>
          {goals.slice(0, 2).map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            return (
              <View key={goal._id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalProgress}>{progress.toFixed(0)}%</Text>
                </View>
                <View style={styles.goalProgressBar}>
                  <View style={[styles.goalProgressFill, { width: `${Math.min(progress, 100)}%` }]} />
                </View>
                <Text style={styles.goalAmount}>
                  {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  date: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceCard: {
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  incomeCard: {
    flex: 1,
    marginRight: 6,
    alignItems: 'center',
  },
  expenseCard: {
    flex: 1,
    marginLeft: 6,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionText: {
    fontSize: 12,
    color: '#2D3748',
    marginTop: 8,
    textAlign: 'center',
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  chart: {
    borderRadius: 16,
  },
  goalsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 4,
  },
  goalAmount: {
    fontSize: 12,
    color: '#718096',
  },
});

export default DashboardScreen;