import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

export interface FilterOptions {
  searchText: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  dateRange: 'all' | 'week' | 'month' | 'quarter' | 'year';
  minAmount: string;
  maxAmount: string;
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
}

interface FilterViewProps {
  visible: boolean;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  categories: string[];
}

const categories = [
  'Todas',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Moradia',
  'Roupas',
  'Tecnologia',
  'Viagem',
  'Pets',
  'Presentes',
  'Streaming',
  'Assinaturas',
  'Outros'
];

const FilterView: React.FC<FilterViewProps> = ({ 
  visible, 
  filters, 
  onApplyFilters,
  categories: propCategories = categories 
}) => {
  const { theme } = useTheme();
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (visible) {
      height.value = withSpring(400, {
        damping: 15,
        stiffness: 100,
      });
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    } else {
      height.value = withTiming(0, {
        duration: 250,
        easing: Easing.in(Easing.quad),
      });
      opacity.value = withTiming(0, {
        duration: 200,
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: 'hidden',
  }));

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      searchText: '',
      type: 'all',
      category: 'Todas',
      dateRange: 'all',
      minAmount: '',
      maxAmount: '',
      sortBy: 'date',
      sortOrder: 'desc',
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    // Auto-aplicar filtros em tempo real
    onApplyFilters(newFilters);
  };

  if (!visible) {
    return (
      <Animated.View style={[styles.container, animatedStyle]} />
    );
  }

  return (
    <Animated.View style={[
      styles.container, 
      { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border },
      animatedStyle
    ]}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="options" size={20} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Filtros Avançados
            </Text>
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Ionicons name="refresh" size={16} color={theme.colors.error} />
            <Text style={[styles.resetText, { color: theme.colors.error }]}>
              Limpar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tipo */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            TIPO DE TRANSAÇÃO
          </Text>
          <View style={styles.typeContainer}>
            {[
              { key: 'all', label: 'Todas', icon: 'list' },
              { key: 'income', label: 'Receitas', icon: 'trending-up' },
              { key: 'expense', label: 'Despesas', icon: 'trending-down' }
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: localFilters.type === option.key 
                      ? theme.colors.primary 
                      : `${theme.colors.border}50`,
                    borderColor: localFilters.type === option.key 
                      ? theme.colors.primary 
                      : theme.colors.border,
                  }
                ]}
                onPress={() => updateFilter('type', option.key)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={16} 
                  color={localFilters.type === option.key ? '#FFFFFF' : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.typeText,
                  { 
                    color: localFilters.type === option.key ? '#FFFFFF' : theme.colors.textSecondary,
                    fontWeight: localFilters.type === option.key ? '600' : '400'
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categoria */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            CATEGORIA
          </Text>
          <View style={[
            styles.pickerContainer, 
            { 
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.border 
            }
          ]}>
            <Picker
              selectedValue={localFilters.category}
              onValueChange={(value) => updateFilter('category', value)}
              style={{ color: theme.colors.text }}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Período */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            PERÍODO
          </Text>
          <View style={styles.dateContainer}>
            {[
              { key: 'all', label: 'Tudo' },
              { key: 'week', label: '7 dias' },
              { key: 'month', label: '1 mês' },
              { key: 'quarter', label: '3 meses' },
              { key: 'year', label: '1 ano' }
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: localFilters.dateRange === option.key 
                      ? theme.colors.primary 
                      : theme.colors.background,
                    borderColor: localFilters.dateRange === option.key 
                      ? theme.colors.primary 
                      : theme.colors.border,
                  }
                ]}
                onPress={() => updateFilter('dateRange', option.key)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateText,
                  {
                    color: localFilters.dateRange === option.key 
                      ? '#FFFFFF' 
                      : theme.colors.textSecondary,
                    fontWeight: localFilters.dateRange === option.key ? '600' : '400'
                  }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Valores */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            FAIXA DE VALORES
          </Text>
          <View style={styles.rangeContainer}>
            <View style={[
              styles.rangeInputContainer,
              { 
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border 
              }
            ]}>
              <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>
                R$
              </Text>
              <TextInput
                style={[styles.rangeInput, { color: theme.colors.text }]}
                placeholder="Mín"
                placeholderTextColor={theme.colors.textSecondary}
                value={localFilters.minAmount}
                onChangeText={(text) => updateFilter('minAmount', text)}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.rangeSeparator}>
              <Text style={[styles.separatorText, { color: theme.colors.textSecondary }]}>
                até
              </Text>
            </View>
            
            <View style={[
              styles.rangeInputContainer,
              { 
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border 
              }
            ]}>
              <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>
                R$
              </Text>
              <TextInput
                style={[styles.rangeInput, { color: theme.colors.text }]}
                placeholder="Máx"
                placeholderTextColor={theme.colors.textSecondary}
                value={localFilters.maxAmount}
                onChangeText={(text) => updateFilter('maxAmount', text)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Ordenação */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            ORDENAÇÃO
          </Text>
          
          <View style={styles.sortRow}>
            <View style={styles.sortSection}>
              <Text style={[styles.sortLabel, { color: theme.colors.text }]}>
                Ordenar por:
              </Text>
              <View style={[
                styles.sortPickerContainer,
                { 
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border 
                }
              ]}>
                <Picker
                  selectedValue={localFilters.sortBy}
                  onValueChange={(value) => updateFilter('sortBy', value)}
                  style={{ color: theme.colors.text }}
                >
                  <Picker.Item label="Data" value="date" />
                  <Picker.Item label="Valor" value="amount" />
                  <Picker.Item label="Categoria" value="category" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.sortOrderContainer}>
              <TouchableOpacity
                style={[
                  styles.sortOrderButton,
                  {
                    backgroundColor: localFilters.sortOrder === 'desc' 
                      ? theme.colors.primary 
                      : theme.colors.background,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => updateFilter('sortOrder', 'desc')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="arrow-down" 
                  size={16} 
                  color={localFilters.sortOrder === 'desc' ? '#FFFFFF' : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.sortOrderText,
                  {
                    color: localFilters.sortOrder === 'desc' ? '#FFFFFF' : theme.colors.textSecondary,
                    fontWeight: localFilters.sortOrder === 'desc' ? '600' : '400'
                  }
                ]}>
                  Maior
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sortOrderButton,
                  {
                    backgroundColor: localFilters.sortOrder === 'asc' 
                      ? theme.colors.primary 
                      : theme.colors.background,
                    borderColor: theme.colors.border,
                  }
                ]}
                onPress={() => updateFilter('sortOrder', 'asc')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="arrow-up" 
                  size={16} 
                  color={localFilters.sortOrder === 'asc' ? '#FFFFFF' : theme.colors.textSecondary} 
                />
                <Text style={[
                  styles.sortOrderText,
                  {
                    color: localFilters.sortOrder === 'asc' ? '#FFFFFF' : theme.colors.textSecondary,
                    fontWeight: localFilters.sortOrder === 'asc' ? '600' : '400'
                  }
                ]}>
                  Menor
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  typeText: {
    fontSize: 12,
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  rangeInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  rangeSeparator: {
    alignItems: 'center',
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortRow: {
    gap: 12,
  },
  sortSection: {
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortPickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sortOrderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOrderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  sortOrderText: {
    fontSize: 12,
  },
});

export default FilterView