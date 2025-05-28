import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  withSequence
} from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import AddTransactionModal from '../../components/AddTransactionModal';
import FilterModal, { FilterOptions } from '../../components/FilterModal';
import SwipeableTransactionCard from '../../components/SwipeableTransactionCard';
import LoadingAnimation from '../../components/LoadingAnimation';
import { Transaction } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedComponents';

interface RenderTransactionProps {
  item: Transaction;
  index: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const TransactionsScreen = () => {
  const { theme, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<FilterOptions>({
    searchText: '',
    type: 'all',
    category: 'Todas',
    dateRange: 'all',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions');
      return response.data;
    }
  });

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filters.searchText) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(filters.searchText.toLowerCase()) ||
        t.category.toLowerCase().includes(filters.searchText.toLowerCase())
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.category !== 'Todas') {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (filters.dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }

    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount.replace(',', '.'));
      if (!isNaN(minAmount)) {
        filtered = filtered.filter(t => t.amount >= minAmount);
      }
    }

    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount.replace(',', '.'));
      if (!isNaN(maxAmount)) {
        filtered = filtered.filter(t => t.amount <= maxAmount);
      }
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [transactions, filters]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Esta ação não pode ser desfeita. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Deletar', 
          onPress: () => deleteMutation.mutate(id), 
          style: 'destructive' 
        }
      ]
    );
  }, [deleteMutation]);

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    setTimeout(() => setRefreshing(false), 1000);
  }, [queryClient]);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchText) count++;
    if (filters.type !== 'all') count++;
    if (filters.category !== 'Todas') count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    return count;
  };

  const addButtonScale = useSharedValue(1);

  const handleAddPress = () => {
    addButtonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    setModalVisible(true);
  };

  const addButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const renderTransaction = ({ item, index }: RenderTransactionProps) => (
    <Animated.View
      entering={SlideInRight.delay(index * 50)}
      exiting={SlideOutLeft}
    >
      <SwipeableTransactionCard
        item={item}
        onDelete={handleDelete}
        onEdit={(transaction) => {
          Alert.alert('Em breve', 'Funcionalidade de edição será implementada');
        }}
      />
    </Animated.View>
  );

  const renderHeader = () => (
    <Animated.View entering={FadeIn.duration(500)}>
      <ThemedView level="surface" style={{
        ...styles.headerActions,
        borderBottomColor: isDark ? theme.colors.border : 'rgba(0,0,0,0.1)'
      }}>
        <View style={{
          ...styles.searchContainer,
          backgroundColor: isDark ? theme.colors.card : theme.colors.background,
          borderColor: isDark ? theme.colors.border : 'transparent',
          borderWidth: isDark ? 1 : 0,
        }}>
          <Ionicons 
            name="search" 
            size={20} 
            color={isDark ? theme.colors.primary : theme.colors.textSecondary} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Buscar transações..."
            placeholderTextColor={isDark ? theme.colors.textSecondary : '#999'}
            value={filters.searchText}
            onChangeText={(text) => setFilters(prev => ({ ...prev, searchText: text }))}
          />
          {filters.searchText ? (
            <TouchableOpacity
              onPress={() => setFilters(prev => ({ ...prev, searchText: '' }))}
              style={styles.clearButton}
            >
              <Ionicons 
                name="close-circle" 
                size={20} 
                color={isDark ? theme.colors.textSecondary : '#999'} 
              />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={{
            ...styles.filterButton,
            backgroundColor: isDark ? `${theme.colors.primary}25` : `${theme.colors.primary}15`,
            borderColor: isDark ? theme.colors.primary : 'transparent',
            borderWidth: isDark ? 1 : 0,
          }}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons 
            name="options" 
            size={20} 
            color={isDark ? theme.colors.primary : theme.colors.primary} 
          />
          <ThemedText variant="caption" color="primary" style={{ fontWeight: '600' }}>
            Filtros
          </ThemedText>
          {getActiveFiltersCount() > 0 && (
            <Animated.View 
              style={[styles.filterBadge, { backgroundColor: theme.colors.primary }]}
              entering={FadeIn}
            >
              <ThemedText variant="caption" style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                {getActiveFiltersCount()}
              </ThemedText>
            </Animated.View>
          )}
        </TouchableOpacity>
      </ThemedView>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn.delay(300)} style={styles.emptyState}>
      <View style={{
        ...styles.emptyIcon,
        backgroundColor: isDark ? `${theme.colors.primary}20` : `${theme.colors.primary}10`,
        borderColor: isDark ? `${theme.colors.primary}40` : 'transparent',
        borderWidth: isDark ? 2 : 0,
      }}>
        <Ionicons 
          name="receipt-outline" 
          size={48} 
          color={isDark ? theme.colors.primary : theme.colors.primary} 
        />
      </View>
      <ThemedText variant="subtitle" color="text" style={{ marginTop: 16, textAlign: 'center', fontWeight: '600' }}>
        {getActiveFiltersCount() > 0 ? 'Nenhuma transação encontrada' : 'Suas transações aparecerão aqui'}
      </ThemedText>
      <ThemedText variant="body" color="textSecondary" style={{ textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
        {getActiveFiltersCount() > 0 
          ? 'Tente ajustar os filtros ou adicionar uma nova transação'
          : 'Adicione sua primeira transação para começar a organizar suas finanças!'
        }
      </ThemedText>
      {getActiveFiltersCount() === 0 && (
        <TouchableOpacity 
          style={{
            ...styles.emptyActionButton,
            backgroundColor: theme.colors.primary,
            shadowColor: isDark ? theme.colors.primary : '#000',
            shadowOpacity: isDark ? 0.3 : 0.2,
          }}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <ThemedText variant="body" style={{ color: '#FFFFFF', marginLeft: 8, fontWeight: '600' }}>
            Adicionar primeira transação
          </ThemedText>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  const renderListFooter = () => (
    <Animated.View entering={FadeIn.delay(200)} style={styles.listFooter}>
      {filteredTransactions.length > 0 && (
        <View style={{
          ...styles.tipContainer,
          backgroundColor: isDark ? `${theme.colors.primary}15` : `${theme.colors.primary}08`,
          borderColor: isDark ? `${theme.colors.primary}30` : 'transparent',
          borderWidth: isDark ? 1 : 0,
        }}>
          <Ionicons 
            name="information-circle" 
            size={16} 
            color={isDark ? theme.colors.primary : theme.colors.textSecondary} 
          />
          <ThemedText 
            variant="caption" 
            color={isDark ? 'primary' : 'textSecondary'} 
            style={{ textAlign: 'center', marginLeft: 8, flex: 1 }}
          >
            💡 Dica: Deslize para a esquerda para deletar, para a direita para editar
          </ThemedText>
        </View>
      )}
    </Animated.View>
  );

  const renderActiveFilters = () => {
    if (getActiveFiltersCount() === 0) return null;

    const activeFilters = [];
    
    if (filters.type !== 'all') {
      activeFilters.push({
        key: 'type',
        label: filters.type === 'income' ? 'Receitas' : 'Despesas',
        onRemove: () => setFilters(prev => ({ ...prev, type: 'all' }))
      });
    }
    
    if (filters.category !== 'Todas') {
      activeFilters.push({
        key: 'category',
        label: filters.category,
        onRemove: () => setFilters(prev => ({ ...prev, category: 'Todas' }))
      });
    }
    
    if (filters.dateRange !== 'all') {
      const dateLabels = {
        week: '7 dias',
        month: '1 mês',
        quarter: '3 meses',
        year: '1 ano'
      };
      activeFilters.push({
        key: 'dateRange',
        label: dateLabels[filters.dateRange as keyof typeof dateLabels],
        onRemove: () => setFilters(prev => ({ ...prev, dateRange: 'all' }))
      });
    }

    return (
      <Animated.View entering={FadeIn} style={styles.activeFiltersContainer}>
        <ThemedView level="surface" style={{
          ...styles.activeFilters,
          borderBottomColor: isDark ? theme.colors.border : 'rgba(0,0,0,0.1)'
        }}>
          <View style={styles.activeFiltersHeader}>
            <ThemedText variant="caption" color="textSecondary" style={{ fontWeight: '600' }}>
              FILTROS ATIVOS
            </ThemedText>
            <TouchableOpacity 
              onPress={() => setFilters({
                searchText: '',
                type: 'all',
                category: 'Todas',
                dateRange: 'all',
                minAmount: '',
                maxAmount: '',
                sortBy: 'date',
                sortOrder: 'desc',
              })}
            >
              <ThemedText variant="caption" color="error" style={{ fontWeight: '600' }}>
                LIMPAR TUDO
              </ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.activeFiltersList}>
            {activeFilters.map((filter) => (
              <View 
                key={filter.key} 
                style={{
                  ...styles.activeFilterChip,
                  backgroundColor: isDark ? `${theme.colors.primary}20` : `${theme.colors.primary}15`,
                  borderColor: isDark ? theme.colors.primary : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                }}
              >
                <ThemedText variant="caption" color="primary" style={{ fontWeight: '500' }}>
                  {filter.label}
                </ThemedText>
                <TouchableOpacity onPress={filter.onRemove} style={styles.removeFilterButton}>
                  <Ionicons name="close" size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ThemedView>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <ThemedView level="background" style={styles.loadingContainer}>
        <LoadingAnimation />
        <ThemedText variant="body" color="textSecondary" style={{ textAlign: 'center', marginTop: 16 }}>
          Carregando transações...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView level="background" style={styles.container}>
      <Animated.View entering={SlideInRight.duration(400)}>
        <ThemedView level="surface" style={{
          ...styles.header,
          borderBottomColor: isDark ? theme.colors.border : 'rgba(0,0,0,0.1)'
        }}>
          <View style={styles.headerContent}>
            <ThemedText variant="title" color="text" style={{ fontWeight: 'bold' }}>
              💳 Transações
            </ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transação' : 'transações'}
            </ThemedText>
          </View>
          <AnimatedTouchableOpacity 
            style={[
              styles.addButton, 
              { 
                backgroundColor: theme.colors.primary,
                shadowColor: isDark ? theme.colors.primary : '#000',
                shadowOpacity: isDark ? 0.4 : 0.2,
              }, 
              addButtonAnimatedStyle
            ]}
            onPress={handleAddPress}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </AnimatedTouchableOpacity>
        </ThemedView>
      </Animated.View>

      {renderHeader()}
      {renderActiveFilters()}

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item._id!}
        contentContainerStyle={[
          styles.list,
          filteredTransactions.length === 0 && styles.emptyList
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderListFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={isDark ? theme.colors.surface : '#FFFFFF'}
          />
        }
      />

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        categories={[]}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  headerActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  filterBadge: {
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  activeFiltersContainer: {
    // Container para os filtros ativos
  },
  activeFilters: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  removeFilterButton: {
    padding: 2,
  },
  list: {
    padding: 20,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  listFooter: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
});

export default TransactionsScreen;