import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { ModalProps } from '../types';

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

interface FilterModalProps extends ModalProps {
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
  'Outros'
];

const FilterModal: React.FC<FilterModalProps> = ({ 
  visible, 
  onClose, 
  filters, 
  onApplyFilters,
  categories: propCategories = categories 
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
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
  };

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Filtros</Text>
          <TouchableOpacity onPress={handleApply}>
            <Text style={styles.applyButton}>Aplicar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 Busca</Text>
            <TextInput
              style={styles.input}
              placeholder="Buscar por descrição..."
              value={localFilters.searchText}
              onChangeText={(text) => updateFilter('searchText', text)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Tipo</Text>
            <View style={styles.segmentContainer}>
              {[
                { key: 'all', label: 'Todas' },
                { key: 'income', label: 'Receitas' },
                { key: 'expense', label: 'Despesas' }
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.segmentButton,
                    localFilters.type === option.key && styles.segmentButtonActive
                  ]}
                  onPress={() => updateFilter('type', option.key)}
                >
                  <Text style={[
                    styles.segmentText,
                    localFilters.type === option.key && styles.segmentTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏷️ Categoria</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={localFilters.category}
                onValueChange={(value) => updateFilter('category', value)}
                style={styles.picker}
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Período</Text>
            <View style={styles.segmentContainer}>
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
                    localFilters.dateRange === option.key && styles.dateButtonActive
                  ]}
                  onPress={() => updateFilter('dateRange', option.key)}
                >
                  <Text style={[
                    styles.dateText,
                    localFilters.dateRange === option.key && styles.dateTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💵 Valor</Text>
            <View style={styles.rangeContainer}>
              <TextInput
                style={[styles.input, styles.rangeInput]}
                placeholder="Mín (R$)"
                value={localFilters.minAmount}
                onChangeText={(text) => updateFilter('minAmount', text)}
                keyboardType="numeric"
              />
              <Text style={styles.rangeSeparator}>até</Text>
              <TextInput
                style={[styles.input, styles.rangeInput]}
                placeholder="Máx (R$)"
                value={localFilters.maxAmount}
                onChangeText={(text) => updateFilter('maxAmount', text)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Ordenação</Text>
            <View style={styles.sortContainer}>
              <View style={styles.sortSection}>
                <Text style={styles.sortLabel}>Ordenar por:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={localFilters.sortBy}
                    onValueChange={(value) => updateFilter('sortBy', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Data" value="date" />
                    <Picker.Item label="Valor" value="amount" />
                    <Picker.Item label="Categoria" value="category" />
                  </Picker>
                </View>
              </View>
              
              <View style={styles.sortSection}>
                <Text style={styles.sortLabel}>Ordem:</Text>
                <View style={styles.segmentContainer}>
                  <TouchableOpacity
                    style={[
                      styles.sortButton,
                      localFilters.sortOrder === 'desc' && styles.sortButtonActive
                    ]}
                    onPress={() => updateFilter('sortOrder', 'desc')}
                  >
                    <Ionicons 
                      name="arrow-down" 
                      size={16} 
                      color={localFilters.sortOrder === 'desc' ? 'white' : '#666'} 
                    />
                    <Text style={[
                      styles.sortButtonText,
                      localFilters.sortOrder === 'desc' && styles.sortButtonTextActive
                    ]}>
                      Maior
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sortButton,
                      localFilters.sortOrder === 'asc' && styles.sortButtonActive
                    ]}
                    onPress={() => updateFilter('sortOrder', 'asc')}
                  >
                    <Ionicons 
                      name="arrow-up" 
                      size={16} 
                      color={localFilters.sortOrder === 'asc' ? 'white' : '#666'} 
                    />
                    <Text style={[
                      styles.sortButtonText,
                      localFilters.sortOrder === 'asc' && styles.sortButtonTextActive
                    ]}>
                      Menor
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="refresh" size={20} color="#666" />
              <Text style={styles.resetButtonText}>Limpar Filtros</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    color: '#666',
    fontSize: 16,
  },
  applyButton: {
    color: '#2E86AB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  segmentContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    minWidth: 80,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#2E86AB',
  },
  segmentText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  pickerContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    margin: 2,
  },
  dateButtonActive: {
    backgroundColor: '#2E86AB',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  dateTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rangeInput: {
    flex: 1,
  },
  rangeSeparator: {
    fontSize: 14,
    color: '#666',
  },
  sortContainer: {
    gap: 15,
  },
  sortSection: {
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#2E86AB',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default FilterModal;