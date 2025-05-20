// src/components/TransactionForm.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { Transaction, Category } from '../types';
import { useCategories } from '../context/CategoryContext';
import CategorySelector from './CategorySelector';
import AmountInput from './AmountInput';

interface TransactionFormProps {
  initialValues?: Partial<Transaction>;
  onSubmit: (transaction: Transaction) => void;
  isEditing?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  initialValues,
  onSubmit,
  isEditing = false
}) => {
  const { theme } = useTheme();
  const { categories } = useCategories();
  
  // Form state
  const [type, setType] = useState<'income' | 'expense'>(initialValues?.type || 'expense');
  const [amount, setAmount] = useState<number>(initialValues?.amount || 0);
  const [description, setDescription] = useState<string>(initialValues?.description || '');
  const [category, setCategory] = useState<Category | null>(
    typeof initialValues?.category === 'object' 
      ? initialValues.category 
      : null
  );
  const [date, setDate] = useState<Date>(
    initialValues?.date 
      ? new Date(initialValues.date) 
      : new Date()
  );
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  
  // Form validation
  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
    description?: string;
  }>({});
  
  // When the type changes, reset the category
  useEffect(() => {
    setCategory(null);
  }, [type]);
  
  // Format date for display
  const formattedDate = date.toLocaleDateString('pt-BR');
  
  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {
      amount?: string;
      category?: string;
      description?: string;
    } = {};
    
    if (amount <= 0) {
      newErrors.amount = 'O valor deve ser maior que zero';
    }
    
    if (!category) {
      newErrors.category = 'Selecione uma categoria';
    }
    
    if (description && description.length > 100) {
      newErrors.description = 'A descrição deve ter no máximo 100 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      const transaction: Transaction = {
        _id: initialValues?._id,
        type,
        amount,
        description: description || '',
        category: category?._id || '',
        date: date.toISOString(),
      };
      
      onSubmit(transaction);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Transaction Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'expense' && styles.activeTypeButton,
              type === 'expense' && { backgroundColor: '#dc3545' }
            ]}
            onPress={() => setType('expense')}
          >
            <Icon 
              name="arrow-up" 
              size={24} 
              color={type === 'expense' ? '#ffffff' : theme.textSecondary} 
            />
            <Text 
              style={[
                styles.typeButtonText,
                { color: type === 'expense' ? '#ffffff' : theme.textSecondary }
              ]}
            >
              Despesa
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'income' && styles.activeTypeButton,
              type === 'income' && { backgroundColor: '#28a745' }
            ]}
            onPress={() => setType('income')}
          >
            <Icon 
              name="arrow-down" 
              size={24} 
              color={type === 'income' ? '#ffffff' : theme.textSecondary} 
            />
            <Text 
              style={[
                styles.typeButtonText,
                { color: type === 'income' ? '#ffffff' : theme.textSecondary }
              ]}
            >
              Receita
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Amount Input */}
        <AmountInput 
          value={amount}
          onChange={setAmount}
          error={errors.amount}
          isIncome={type === 'income'}
        />
        
        {/* Category Selector */}
        <CategorySelector 
          selectedCategory={category}
          onSelectCategory={setCategory}
          transactionType={type}
          error={errors.category}
        />
        
        {/* Description Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Descrição (opcional)</Text>
          <TextInput
            style={[
              styles.input,
              { 
                color: theme.text,
                borderColor: errors.description ? theme.error : theme.border,
                backgroundColor: theme.card
              }
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Mercado, Salário, etc."
            placeholderTextColor={theme.textSecondary}
          />
          {errors.description && (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.description}
            </Text>
          )}
        </View>
        
        {/* Date Selector */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Data</Text>
          <TouchableOpacity
            style={[
              styles.dateSelector,
              { borderColor: theme.border, backgroundColor: theme.card }
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar" size={20} color={theme.primary} />
            <Text style={[styles.dateText, { color: theme.text }]}>
              {formattedDate}
            </Text>
          </TouchableOpacity>
        </View>
        
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Atualizar' : 'Adicionar'} {type === 'income' ? 'Receita' : 'Despesa'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  activeTypeButton: {
    backgroundColor: '#6200ee',
  },
  typeButtonText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 8,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransactionForm;