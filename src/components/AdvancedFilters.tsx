// src/components/AdvancedFilters.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../context/CategoryContext';
import AmountInput from './AmountInput';
import { format, subDays, subMonths, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface FilterOptions {
  dateRange: {
    start: Date | null;
    end: Date | null;
    preset: 'custom' | 'last7days' | 'last30days' | 'last3months' | 'thisYear' | 'all';
  };
  transactionType: 'all' | 'income' | 'expense';
  categories: string[]; // Array de IDs das categorias selecionadas
  amountRange: {
    min: number | null;
    max: number | null;
  };
  description: string;
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  visible,
  onClose,
  onApplyFilters,
  currentFilters
}) => {
  const { theme } = useTheme();
  const { categories } = useCategories();
  
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  const datePresets = [
    { key: 'all', label: 'Todos os períodos', getValue: () => ({ start: null, end: null }) },
    { key: 'last7days', label: 'Últimos 7 dias', getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
    { key: 'last30days', label: 'Últimos 30 dias', getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
    { key: 'last3months', label: 'Últimos 3 meses', getValue: () => ({ start: subMonths(new Date(), 3), end: new Date() }) },
    { key: 'thisYear', label: 'Este ano', getValue: () => ({ start: startOfYear(new Date()), end: new Date() }) },
  ];

  const handleDatePresetChange = (preset: string) => {
    const presetData = datePresets.find(p => p.key === preset);
    if (presetData) {
      const dateRange = presetData.getValue();
      setFilters(prev => ({
        ...prev,
        dateRange: {
          ...dateRange,
          preset: preset as any
        }
      }));
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleResetFilters = () => {
    const defaultFilters: FilterOptions = {
      dateRange: { start: null, end: null, preset: 'all' },
      transactionType: 'all',
      categories: [],
      amountRange: { min: null, max: null },
      description: '',
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    
    if (filters.dateRange.preset !== 'all') count++;
    if (filters.transactionType !== 'all') count++;
    if (filters.categories.length > 0) count++;
    if (filters.amountRange.min !== null || filters.amountRange.max !== null) count++;
    if (filters.description.trim() !== '') count++;
    
    return count;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Filtros Avançados
          </Text>
          
          <TouchableOpacity onPress={handleResetFilters}>
            <Text style={[styles.resetButton, { color: theme.primary }]}>
              Limpar
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Período */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Período
            </Text>
            
            {datePresets.map(preset => (
              <TouchableOpacity
                key={preset.key}
                style={[
                  styles.optionRow,
                  { backgroundColor: theme.card },
                  filters.dateRange.preset === preset.key && { borderColor: theme.primary, borderWidth: 2 }
                ]}
                onPress={() => handleDatePresetChange(preset.key)}
              >
                <Text style={[styles.optionText, { color: theme.text }]}>
                  {preset.label}
                </Text>
                {filters.dateRange.preset === preset.key && (
                  <Icon name="check-circle" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Tipo de Transação */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Tipo de Transação
            </Text>
            
            <View style={styles.typeSelector}>
              {[
                { key: 'all', label: 'Todas', color: theme.text },
                { key: 'income', label: 'Receitas', color: theme.success },
                { key: 'expense', label: 'Despesas', color: theme.error }
              ].map(type => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeOption,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    filters.transactionType === type.key && { 
                      backgroundColor: type.color + '20',
                      borderColor: type.color 
                    }
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, transactionType: type.key as any }))}
                >
                  <Text style={[
                    styles.typeText,
                    { color: filters.transactionType === type.key ? type.color : theme.text }
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Categorias */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Categorias
            </Text>
            
            <View style={styles.categoriesGrid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category._id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    filters.categories.includes(category._id!) && {
                      backgroundColor: category.color + '20',
                      borderColor: category.color
                    }
                  ]}
                  onPress={() => handleCategoryToggle(category._id!)}
                >
                  <View style={[
                    styles.categoryDot,
                    { backgroundColor: category.color }
                  ]} />
                  <Text style={[
                    styles.categoryChipText,
                    { color: filters.categories.includes(category._id!) ? category.color : theme.text }
                  ]}>
                    {category.name}
                  </Text>
                  {filters.categories.includes(category._id!) && (
                    <Icon name="check" size={16} color={category.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Faixa de Valores */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Faixa de Valores
            </Text>
            
            <View style={styles.amountRangeContainer}>
              <View style={styles.amountInputWrapper}>
                <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
                  Valor Mínimo
                </Text>
                <AmountInput
                  value={filters.amountRange.min || 0}
                  onChange={(value) => setFilters(prev => ({
                    ...prev,
                    amountRange: { ...prev.amountRange, min: value > 0 ? value : null }
                  }))}
                  placeholder="R$ 0,00"
                />
              </View>
              
              <View style={styles.amountInputWrapper}>
                <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
                  Valor Máximo
                </Text>
                <AmountInput
                  value={filters.amountRange.max || 0}
                  onChange={(value) => setFilters(prev => ({
                    ...prev,
                    amountRange: { ...prev.amountRange, max: value > 0 ? value : null }
                  }))}
                  placeholder="R$ 0,00"
                />
              </View>
            </View>
          </View>

          {/* Ordenação */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Ordenação
            </Text>
            
            <View style={styles.sortContainer}>
              <View style={styles.sortSection}>
                <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>
                  Ordenar por:
                </Text>
                <View style={styles.sortOptions}>
                  {[
                    { key: 'date', label: 'Data' },
                    { key: 'amount', label: 'Valor' },
                    { key: 'category', label: 'Categoria' }
                  ].map(option => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.sortOption,
                        { backgroundColor: theme.card, borderColor: theme.border },
                        filters.sortBy === option.key && { 
                          backgroundColor: theme.primary + '20',
                          borderColor: theme.primary 
                        }
                      ]}
                      onPress={() => setFilters(prev => ({ ...prev, sortBy: option.key as any }))}
                    >
                      <Text style={[
                        styles.sortOptionText,
                        { color: filters.sortBy === option.key ? theme.primary : theme.text }
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.sortSection}>
                <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>
                  Ordem:
                </Text>
                <View style={styles.sortOrderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.sortOrderOption,
                      { backgroundColor: theme.card },
                      filters.sortOrder === 'desc' && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                  >
                    <Icon 
                      name="sort-descending" 
                      size={20} 
                      color={filters.sortOrder === 'desc' ? '#fff' : theme.text} 
                    />
                    <Text style={[
                      styles.sortOrderText,
                      { color: filters.sortOrder === 'desc' ? '#fff' : theme.text }
                    ]}>
                      Decrescente
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.sortOrderOption,
                      { backgroundColor: theme.card },
                      filters.sortOrder === 'asc' && { backgroundColor: theme.primary }
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                  >
                    <Icon 
                      name="sort-ascending" 
                      size={20} 
                      color={filters.sortOrder === 'asc' ? '#fff' : theme.text} 
                    />
                    <Text style={[
                      styles.sortOrderText,
                      { color: filters.sortOrder === 'asc' ? '#fff' : theme.text }
                    ]}>
                      Crescente
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
          <Text style={[styles.activeFiltersText, { color: theme.textSecondary }]}>
            {getActiveFiltersCount()} filtro{getActiveFiltersCount() !== 1 ? 's' : ''} ativo{getActiveFiltersCount() !== 1 ? 's' : ''}
          </Text>
          
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: theme.primary }]}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>
              Aplicar Filtros
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionText: {
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    marginRight: 6,
  },
  amountRangeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  amountInputWrapper: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  sortContainer: {
    gap: 16,
  },
  sortSection: {
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortOrderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOrderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  sortOrderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  activeFiltersText: {
    fontSize: 14,
  },
  applyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdvancedFilters;