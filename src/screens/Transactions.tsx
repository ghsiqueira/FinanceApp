// src/screens/Transactions.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionContext';
import { Transaction } from '../types';
import TransactionCard from '../components/TransactionCard';
import MonthSelector from '../components/MonthSelector';

const Transactions = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const {
    transactions,
    loading,
    error,
    fetchTransactions,
  } = useTransactions();

  // Selected date state
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Filter type state (all, income, expense)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  // Refreshing state
  const [refreshing, setRefreshing] = useState(false);

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Get current month and year
  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  // Filter transactions for the selected month and type
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(
      typeof transaction.date === 'string'
        ? transaction.date
        : transaction.date.toString()
    );

    const matchesMonth =
      transactionDate.getFullYear() === currentYear &&
      transactionDate.getMonth() + 1 === currentMonth;

    const matchesType =
      filterType === 'all' || transaction.type === filterType;

    return matchesMonth && matchesType;
  });

  // Navigate to transaction details
  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate('TransactionDetails', { transactionId: transaction._id });
  };

  // Navigate to add transaction
  const handleAddTransaction = () => {
    navigation.navigate('AddTransaction');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MonthSelector
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />

      {/* Type Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterOption,
            filterType === 'all' && { 
              backgroundColor: theme.primary,
              borderColor: theme.primary 
            },
            { borderColor: theme.border }
          ]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filterType === 'all' ? '#fff' : theme.text }
            ]}
          >
            Todos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterOption,
            filterType === 'income' && { 
              backgroundColor: '#28a745',
              borderColor: '#28a745' 
            },
            { borderColor: theme.border }
          ]}
          onPress={() => setFilterType('income')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filterType === 'income' ? '#fff' : theme.text }
            ]}
          >
            Receitas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterOption,
            filterType === 'expense' && { 
              backgroundColor: '#dc3545',
              borderColor: '#dc3545' 
            },
            { borderColor: theme.border }
          ]}
          onPress={() => setFilterType('expense')}
        >
          <Text
            style={[
              styles.filterText,
              { color: filterType === 'expense' ? '#fff' : theme.text }
            ]}
          >
            Despesas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      {loading && !filteredTransactions.length ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="cash-remove" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Nenhuma transação encontrada
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={handleAddTransaction}
          >
            <Text style={styles.addButtonText}>Adicionar Transação</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onPress={handleTransactionPress}
            />
          )}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      )}

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
    padding: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  filterOption: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 80, // For FAB clearance
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
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

export default Transactions;