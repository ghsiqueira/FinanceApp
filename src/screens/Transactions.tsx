// src/screens/Transactions.tsx - Versão atualizada com melhorias
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionContext';
import { useCategories } from '../context/CategoryContext';
import { Transaction, Category } from '../types';
import TransactionCard from '../components/TransactionCard';
import MonthSelector from '../components/MonthSelector';
import { formatCurrency } from '../utils/formatters';
import { format as formatDate, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import exportService from '../services/exportService';

interface FilterOptions {
  type: 'all' | 'income' | 'expense';
  category: string | null;
  amountRange: {
    min: number | null;
    max: number | null;
  };
  searchText: string;
}

const Transactions = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const {
    transactions,
    loading,
    error,
    fetchTransactions,
  } = useTransactions();
  const { categories } = useCategories();

  // Estado principal
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Estados de filtro
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    category: null,
    amountRange: { min: null, max: null },
    searchText: ''
  });

  // Estados temporários para o modal de filtros
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();

  // Transações filtradas com otimização usando useMemo
  const filteredTransactions = useMemo(() => {
    const startDate = startOfMonth(selectedDate);
    const endDate = endOfMonth(selectedDate);

    return transactions.filter(transaction => {
      const transactionDate = new Date(
        typeof transaction.date === 'string'
          ? transaction.date
          : transaction.date.toString()
      );

      // Filtro de mês
      const withinMonth = isWithinInterval(transactionDate, { start: startDate, end: endDate });
      if (!withinMonth) return false;

      // Filtro de tipo
      if (filters.type !== 'all' && transaction.type !== filters.type) return false;

      // Filtro de categoria
      if (filters.category) {
        const categoryId = typeof transaction.category === 'string' 
          ? transaction.category 
          : transaction.category._id;
        if (categoryId !== filters.category) return false;
      }

      // Filtro de valor
      if (filters.amountRange.min && transaction.amount < filters.amountRange.min) return false;
      if (filters.amountRange.max && transaction.amount > filters.amountRange.max) return false;

      // Filtro de texto
      if (filters.searchText.trim()) {
        const searchLower = filters.searchText.toLowerCase();
        const description = (transaction.description || '').toLowerCase();
        const categoryName = typeof transaction.category === 'object' 
          ? transaction.category.name.toLowerCase() 
          : '';
        
        if (!description.includes(searchLower) && !categoryName.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedDate, filters]);

  // Estatísticas do mês
  const monthStats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      balance: income - expense,
      total: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  // Navigate to transaction details
  const handleTransactionPress = (transaction: Transaction) => {
    navigation.navigate('TransactionDetails', { transactionId: transaction._id });
  };

  // Navigate to add transaction
  const handleAddTransaction = () => {
    navigation.navigate('AddTransaction');
  };

  // Apply filters
  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
  };

  // Reset filters
  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      type: 'all',
      category: null,
      amountRange: { min: null, max: null },
      searchText: ''
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setShowFilters(false);
  };

  // Export transactions
  const handleExport = async (exportFormat: 'csv' | 'html') => {
    try {
      setShowExportModal(false);
      
      const fileName = `transacoes_${formatDate(selectedDate, 'yyyy-MM', { locale: ptBR })}.${exportFormat}`;
      
      if (exportFormat === 'csv') {
        await exportService.exportTransactionsToCSV(filteredTransactions, fileName);
      } else {
        const startDate = startOfMonth(selectedDate);
        const endDate = endOfMonth(selectedDate);
        await exportService.exportReportToHTML(filteredTransactions, startDate, endDate, fileName);
      }
      
      Alert.alert('Sucesso', 'Transações exportadas com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      Alert.alert('Erro', 'Não foi possível exportar as transações.');
    }
  };

  // Get active filters count
  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.category) count++;
    if (filters.amountRange.min || filters.amountRange.max) count++;
    if (filters.searchText.trim()) count++;
    return count;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <MonthSelector
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />
      
      {/* Stats Summary */}
      <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Receitas</Text>
          <Text style={[styles.statValue, { color: theme.success }]}>
            {formatCurrency(monthStats.income)}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Despesas</Text>
          <Text style={[styles.statValue, { color: theme.error }]}>
            {formatCurrency(monthStats.expense)}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Saldo</Text>
          <Text style={[
            styles.statValue, 
            { color: monthStats.balance >= 0 ? theme.success : theme.error }
          ]}>
            {formatCurrency(monthStats.balance)}
          </Text>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.filterButton, { borderColor: theme.border }]}
          onPress={() => {
            setTempFilters(filters);
            setShowFilters(true);
          }}
        >
          <Icon name="filter" size={20} color={theme.primary} />
          <Text style={[styles.filterButtonText, { color: theme.primary }]}>
            Filtros
          </Text>
          {getActiveFiltersCount() > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.filterBadgeText}>
                {getActiveFiltersCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.exportButton, { borderColor: theme.border }]}
          onPress={() => setShowExportModal(true)}
        >
          <Icon name="export" size={20} color={theme.textSecondary} />
          <Text style={[styles.exportButtonText, { color: theme.textSecondary }]}>
            Exportar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Icon name="magnify" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar transações..."
          placeholderTextColor={theme.textSecondary}
          value={filters.searchText}
          onChangeText={(text) => setFilters(prev => ({ ...prev, searchText: text }))}
        />
        {filters.searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => setFilters(prev => ({ ...prev, searchText: '' }))}
          >
            <Icon name="close" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results info */}
      <Text style={[styles.resultsInfo, { color: theme.textSecondary }]}>
        {filteredTransactions.length} transação{filteredTransactions.length !== 1 ? 'ões' : ''} encontrada{filteredTransactions.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Filtros
            </Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Icon name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {/* Type Filter */}
            <Text style={[styles.filterSectionTitle, { color: theme.text }]}>
              Tipo de Transação
            </Text>
            <View style={styles.typeFilterContainer}>
              {[
                { key: 'all', label: 'Todas', icon: 'swap-horizontal' },
                { key: 'income', label: 'Receitas', icon: 'arrow-down' },
                { key: 'expense', label: 'Despesas', icon: 'arrow-up' }
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.typeFilterOption,
                    tempFilters.type === option.key && { 
                      backgroundColor: theme.primary,
                      borderColor: theme.primary 
                    },
                    { borderColor: theme.border }
                  ]}
                  onPress={() => setTempFilters(prev => ({ 
                    ...prev, 
                    type: option.key as 'all' | 'income' | 'expense' 
                  }))}
                >
                  <Icon 
                    name={option.icon} 
                    size={20} 
                    color={tempFilters.type === option.key ? '#fff' : theme.text} 
                  />
                  <Text style={[
                    styles.typeFilterText,
                    { color: tempFilters.type === option.key ? '#fff' : theme.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Filter */}
            <Text style={[styles.filterSectionTitle, { color: theme.text }]}>
              Categoria
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilterContainer}>
              <TouchableOpacity
                style={[
                  styles.categoryFilterOption,
                  !tempFilters.category && { 
                    backgroundColor: theme.primary,
                    borderColor: theme.primary 
                  },
                  { borderColor: theme.border }
                ]}
                onPress={() => setTempFilters(prev => ({ ...prev, category: null }))}
              >
                <Text style={[
                  styles.categoryFilterText,
                  { color: !tempFilters.category ? '#fff' : theme.text }
                ]}>
                  Todas
                </Text>
              </TouchableOpacity>
              
              {categories.map(category => (
                <TouchableOpacity
                  key={category._id}
                  style={[
                    styles.categoryFilterOption,
                    tempFilters.category === category._id && { 
                      backgroundColor: theme.primary,
                      borderColor: theme.primary 
                    },
                    { borderColor: theme.border }
                  ]}
                  onPress={() => setTempFilters(prev => ({ 
                    ...prev, 
                    category: category._id! 
                  }))}
                >
                  <View style={[
                    styles.categoryColorDot,
                    { backgroundColor: category.color }
                  ]} />
                  <Text style={[
                    styles.categoryFilterText,
                    { color: tempFilters.category === category._id ? '#fff' : theme.text }
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Amount Range Filter */}
            <Text style={[styles.filterSectionTitle, { color: theme.text }]}>
              Faixa de Valor
            </Text>
            <View style={styles.amountRangeContainer}>
              <View style={styles.amountInputContainer}>
                <Text style={[styles.amountInputLabel, { color: theme.textSecondary }]}>
                  Valor mínimo
                </Text>
                <TextInput
                  style={[styles.amountInput, { 
                    borderColor: theme.border, 
                    backgroundColor: theme.background,
                    color: theme.text 
                  }]}
                  placeholder="R$ 0,00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={tempFilters.amountRange.min?.toString() || ''}
                  onChangeText={(text) => {
                    const value = parseFloat(text) || null;
                    setTempFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, min: value }
                    }));
                  }}
                />
              </View>
              
              <View style={styles.amountInputContainer}>
                <Text style={[styles.amountInputLabel, { color: theme.textSecondary }]}>
                  Valor máximo
                </Text>
                <TextInput
                  style={[styles.amountInput, { 
                    borderColor: theme.border, 
                    backgroundColor: theme.background,
                    color: theme.text 
                  }]}
                  placeholder="R$ 0,00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={tempFilters.amountRange.max?.toString() || ''}
                  onChangeText={(text) => {
                    const value = parseFloat(text) || null;
                    setTempFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, max: value }
                    }));
                  }}
                />
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.resetButton, { borderColor: theme.error }]}
              onPress={resetFilters}
            >
              <Text style={[styles.resetButtonText, { color: theme.error }]}>
                Limpar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.applyButton, { backgroundColor: theme.primary }]}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderExportModal = () => (
    <Modal
      visible={showExportModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowExportModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.exportModalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.exportModalTitle, { color: theme.text }]}>
            Exportar Transações
          </Text>
          
          <Text style={[styles.exportModalSubtitle, { color: theme.textSecondary }]}>
            {filteredTransactions.length} transação{filteredTransactions.length !== 1 ? 'ões' : ''} de{' '}
            {formatDate(selectedDate, 'MMMM yyyy', { locale: ptBR })}
          </Text>
          
          <TouchableOpacity
            style={[styles.exportOption, { borderColor: theme.border }]}
            onPress={() => handleExport('csv')}
          >
            <Icon name="file-delimited" size={24} color={theme.primary} />
            <View style={styles.exportOptionContent}>
              <Text style={[styles.exportOptionTitle, { color: theme.text }]}>
                Planilha CSV
              </Text>
              <Text style={[styles.exportOptionDescription, { color: theme.textSecondary }]}>
                Para Excel, Google Sheets, etc.
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.exportOption, { borderColor: theme.border }]}
            onPress={() => handleExport('html')}
          >
            <Icon name="file-document" size={24} color={theme.primary} />
            <View style={styles.exportOptionContent}>
              <Text style={[styles.exportOptionTitle, { color: theme.text }]}>
                Relatório HTML
              </Text>
              <Text style={[styles.exportOptionDescription, { color: theme.textSecondary }]}>
                Para visualizar ou converter em PDF
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.cancelExportButton, { borderColor: theme.border }]}
            onPress={() => setShowExportModal(false)}
          >
            <Text style={[styles.cancelExportButtonText, { color: theme.text }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="cash-remove" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {filters.searchText || getActiveFiltersCount() > 0 
                  ? 'Nenhuma transação encontrada'
                  : 'Nenhuma transação neste mês'
                }
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {filters.searchText || getActiveFiltersCount() > 0
                  ? 'Tente ajustar os filtros de busca'
                  : 'Adicione sua primeira transação'
                }
              </Text>
              {(!filters.searchText && getActiveFiltersCount() === 0) && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: theme.primary }]}
                  onPress={handleAddTransaction}
                >
                  <Text style={styles.emptyButtonText}>Adicionar Transação</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          contentContainerStyle={filteredTransactions.length === 0 ? styles.emptyListContainer : styles.listContent}
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

      {renderFiltersModal()}
      {renderExportModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  filterButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  filterBadge: {
    marginLeft: 8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  exportButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  resultsInfo: {
    fontSize: 12,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 80, // Para o FAB
  },
  emptyListContainer: {
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  typeFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeFilterOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeFilterText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryFilterContainer: {
    marginBottom: 8,
  },
  categoryFilterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  amountRangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInputContainer: {
    flex: 1,
  },
  amountInputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#6200ee',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exportModalContent: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  exportModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  exportModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  exportOptionContent: {
    marginLeft: 16,
    flex: 1,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exportOptionDescription: {
    fontSize: 14,
  },
  cancelExportButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelExportButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});