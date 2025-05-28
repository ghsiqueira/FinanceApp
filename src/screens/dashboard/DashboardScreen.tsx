import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Transaction, Goal } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemedView, ThemedText, ThemedCard, StatCard } from '../../components/ThemedComponents';

const DashboardScreen = () => {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data;
    }
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await api.get('/goals');
      return response.data;
    }
  });

  const totalIncome = transactions
    .filter((t: Transaction) => t.type === 'income')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Calcular tendência (mock - você pode implementar lógica real)
  const lastMonthBalance = balance * 0.9; // Simulação
  const balanceTrend = ((balance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100;

  return (
    <ThemedView level="background" style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedView level="surface" style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <ThemedText variant="caption" color="textSecondary">
                Olá! 👋
              </ThemedText>
              <ThemedText variant="title" color="text" style={{ marginTop: 4 }}>
                {user?.name}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </ThemedView>

        {/* Balance Card */}
        <View style={styles.balanceSection}>
          <ThemedCard style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <ThemedText variant="caption" color="textSecondary">
                Saldo Atual
              </ThemedText>
              <View style={styles.trendBadge}>
                <Ionicons 
                  name={balanceTrend >= 0 ? 'trending-up' : 'trending-down'} 
                  size={12} 
                  color={balanceTrend >= 0 ? theme.colors.success : theme.colors.error} 
                />
                <ThemedText 
                  variant="caption" 
                  color={balanceTrend >= 0 ? 'success' : 'error'}
                  style={{ marginLeft: 4 }}
                >
                  {Math.abs(balanceTrend).toFixed(1)}%
                </ThemedText>
              </View>
            </View>
            <ThemedText 
              variant="title" 
              color={balance >= 0 ? 'success' : 'error'}
              style={styles.balanceAmount}
            >
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              {balance >= 0 ? 'Você está no azul! 🎉' : 'Atenção aos gastos ⚠️'}
            </ThemedText>
          </ThemedCard>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Receitas"
            value={`R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon="arrow-up-circle"
            color={theme.colors.success}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            title="Gastos"
            value={`R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon="arrow-down-circle"
            color={theme.colors.error}
            trend={{ value: 8.3, isPositive: false }}
          />
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" color="text">
              🎯 Metas Ativas
            </ThemedText>
            <ThemedText variant="caption" color="primary">
              {goals.length} {goals.length === 1 ? 'meta' : 'metas'}
            </ThemedText>
          </View>

          {goals.length === 0 ? (
            <ThemedCard style={styles.emptyCard}>
              <Ionicons name="flag-outline" size={48} color={theme.colors.textSecondary} />
              <ThemedText variant="body" color="textSecondary" style={{ marginTop: 16, textAlign: 'center' }}>
                Nenhuma meta criada
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: 4 }}>
                Crie metas para alcançar seus objetivos!
              </ThemedText>
            </ThemedCard>
          ) : (
            goals.slice(0, 2).map((goal: Goal, index: number) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <ThemedCard key={index} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <ThemedText variant="body" color="text" style={{ fontWeight: '600' }}>
                      {goal.title}
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      {daysLeft > 0 ? `${daysLeft} dias` : 'Vencida'}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.goalProgress}>
                    <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: progress >= 100 ? theme.colors.success : theme.colors.primary
                          }
                        ]} 
                      />
                    </View>
                    <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 8 }}>
                      {progress.toFixed(0)}%
                    </ThemedText>
                  </View>

                  <View style={styles.goalFooter}>
                    <ThemedText variant="caption" color="textSecondary">
                      R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </ThemedText>
                    <View style={styles.monthlyTarget}>
                      <Ionicons name="calendar" size={12} color={theme.colors.primary} />
                      <ThemedText variant="caption" color="primary" style={{ marginLeft: 4 }}>
                        R$ {goal.monthlyTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                      </ThemedText>
                    </View>
                  </View>
                </ThemedCard>
              );
            })
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="subtitle" color="text">
              💳 Transações Recentes
            </ThemedText>
            <ThemedText variant="caption" color="primary">
              {transactions.length} total
            </ThemedText>
          </View>

          {transactions.length === 0 ? (
            <ThemedCard style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.textSecondary} />
              <ThemedText variant="body" color="textSecondary" style={{ marginTop: 16, textAlign: 'center' }}>
                Nenhuma transação encontrada
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: 4 }}>
                Adicione sua primeira transação!
              </ThemedText>
            </ThemedCard>
          ) : (
            transactions.slice(0, 4).map((transaction: Transaction, index: number) => (
              <ThemedCard key={index} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: transaction.type === 'income' ? `${theme.colors.success}20` : `${theme.colors.error}20` }
                  ]}>
                    <Ionicons 
                      name={transaction.type === 'income' ? 'arrow-up' : 'arrow-down'} 
                      size={16} 
                      color={transaction.type === 'income' ? theme.colors.success : theme.colors.error} 
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <ThemedText variant="body" color="text" style={{ fontWeight: '500' }}>
                      {transaction.description}
                    </ThemedText>
                    <View style={styles.transactionMeta}>
                      <ThemedText variant="caption" color="textSecondary">
                        {transaction.category}
                      </ThemedText>
                      <View style={styles.dot} />
                      <ThemedText variant="caption" color="textSecondary">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <ThemedText 
                  variant="body" 
                  color={transaction.type === 'income' ? 'success' : 'error'}
                  style={{ fontWeight: '600' }}
                >
                  {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </ThemedText>
              </ThemedCard>
            ))
          )}
        </View>

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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
  },
  balanceSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  balanceCard: {
    padding: 24,
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  goalCard: {
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthlyTarget: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionCard: {
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#ccc',
    marginHorizontal: 6,
  },
});

export default DashboardScreen;