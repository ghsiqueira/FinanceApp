// src/screens/Home.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionContext';
import { useGoals } from '../context/GoalContext';
import { Transaction, Goal } from '../types';
import HomeHeader from '../components/HomeHeader';
import TransactionCard from '../components/TransactionCard';
import GoalCard from '../components/GoalCard';
import MonthSelector from '../components/MonthSelector';
import { getData, storeData } from '../utils/storage';

const Home = () => {
  const navigation = useNavigation<any>(); // Type as 'any' for simplicity
  const { theme } = useTheme();
  const { 
    transactions, 
    loading: transactionsLoading, 
    error: transactionsError,
    monthlySummary,
    fetchTransactions,
    fetchMonthlySummary
  } = useTransactions();
  
  const {
    inProgressGoals,
    loading: goalsLoading,
    fetchGoals
  } = useGoals();
  
  // Selected date state
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Hide values state
  const [hideValues, setHideValues] = useState(false);
  
  // Refreshing state
  const [refreshing, setRefreshing] = useState(false);
  
  // Load hide values preference
  useEffect(() => {
    const loadHideValuesPreference = async () => {
      try {
        const hideValuesPreference = await getData('@FinanceApp:hideValues');
        if (hideValuesPreference !== null) {
          setHideValues(hideValuesPreference);
        }
      } catch (error) {
        console.error('Error loading hide values preference:', error);
      }
    };
    
    loadHideValuesPreference();
  }, []);
  
  // Toggle hide values
  const toggleHideValues = async () => {
    const newHideValues = !hideValues;
    setHideValues(newHideValues);
    
    // Save preference
    try {
      await storeData('@FinanceApp:hideValues', newHideValues);
    } catch (error) {
      console.error('Error saving hide values preference:', error);
    }
  };
  
  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Get current month and year
  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();
  
  // Format month name
  const monthName = format(selectedDate, 'MMMM yyyy', { locale: ptBR });
  
  // Effect to fetch monthly summary when date changes
  useEffect(() => {
    fetchMonthlySummary(currentYear, currentMonth);
  }, [currentYear, currentMonth]);
  
  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTransactions(),
      fetchGoals(),
      fetchMonthlySummary(currentYear, currentMonth)
    ]);
    setRefreshing(false);
  };
  
  // Filter transactions for the selected month
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(
      typeof transaction.date === 'string' 
        ? transaction.date 
        : transaction.date.toString()
    );
    return (
      transactionDate.getFullYear() === currentYear &&
      transactionDate.getMonth() + 1 === currentMonth
    );
  });
  
  // Get recent transactions (last 5)
  const recentTransactions = filteredTransactions.slice(0, 5);
  
  // In progress goals (up to 3)
  const highlightedGoals = inProgressGoals.slice(0, 3);
  
  // Navigate to transaction details
  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate('TransactionsTab', {
      screen: 'TransactionDetails',
      params: { transactionId: transaction._id }
    });
  };
  
  // Navigate to goal details
  const handleGoalPress = (goal: Goal) => {
    navigation.navigate('GoalsTab', {
      screen: 'GoalDetails',
      params: { goalId: goal._id }
    });
  };
  
  // Navigate to add transaction
  const handleAddTransaction = () => {
    navigation.navigate('TransactionsTab', {
      screen: 'AddTransaction'
    });
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <HomeHeader
        summary={monthlySummary}
        loading={transactionsLoading}
        monthName={monthName}
        onToggleVisibility={toggleHideValues}
        hideValues={hideValues}
      />
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        <MonthSelector
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
        
        {/* Recent Transactions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Transações recentes
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('TransactionsTab')}
            >
              <Text style={[styles.seeAllText, { color: theme.primary }]}>
                Ver todas
              </Text>
            </TouchableOpacity>
          </View>
          
          {transactionsLoading && !recentTransactions.length ? (
            <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
          ) : transactionsError ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {transactionsError}
            </Text>
          ) : recentTransactions.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
              <Icon name="cash-remove" size={40} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                Nenhuma transação neste mês
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                onPress={handleAddTransaction}
              >
                <Text style={styles.emptyButtonText}>Adicionar Transação</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={recentTransactions}
              renderItem={({ item }) => (
                <TransactionCard
                  transaction={item}
                  onPress={handleTransactionPress}
                />
              )}
              keyExtractor={(item) => item._id || Math.random().toString()}
              scrollEnabled={false}
            />
          )}
        </View>
        
        {/* Active Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Metas em andamento
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('GoalsTab')}
            >
              <Text style={[styles.seeAllText, { color: theme.primary }]}>
                Ver todas
              </Text>
            </TouchableOpacity>
          </View>
          
          {goalsLoading && !highlightedGoals.length ? (
            <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
          ) : highlightedGoals.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: theme.card }]}>
              <Icon name="flag-remove" size={40} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.text }]}>
                Nenhuma meta em andamento
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('GoalsTab', { screen: 'AddGoal' })}
              >
                <Text style={styles.emptyButtonText}>Criar Meta</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={highlightedGoals}
              renderItem={({ item }) => (
                <GoalCard goal={item} onPress={handleGoalPress} />
              )}
              keyExtractor={(item) => item._id || Math.random().toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={handleAddTransaction}
      >
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default Home;