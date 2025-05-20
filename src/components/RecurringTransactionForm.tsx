import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  TextInput
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../context/CategoryContext';
import { Category, RecurringTransaction } from '../types';
import AmountInput from './AmountInput';
import CategorySelector from './CategorySelector';
import { format, addDays, addMonths, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Define proper typed frequency options
type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly';

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' }
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

const MONTHS = [
  { value: 0, label: 'Janeiro' },
  { value: 1, label: 'Fevereiro' },
  { value: 2, label: 'Março' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Maio' },
  { value: 5, label: 'Junho' },
  { value: 6, label: 'Julho' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Setembro' },
  { value: 9, label: 'Outubro' },
  { value: 10, label: 'Novembro' },
  { value: 11, label: 'Dezembro' }
];

interface RecurringTransactionFormProps {
  initialValues?: Partial<RecurringTransaction>;
  onSubmit: (recurringTransaction: RecurringTransaction) => void;
  isEditing?: boolean;
}

const RecurringTransactionForm: React.FC<RecurringTransactionFormProps> = ({
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
  
  // Recurrence specific fields
  const [frequency, setFrequency] = useState<FrequencyType>(initialValues?.frequency as FrequencyType || 'monthly');
  const [dayOfWeek, setDayOfWeek] = useState(initialValues?.dayOfWeek || new Date().getDay());
  const [dayOfMonth, setDayOfMonth] = useState(initialValues?.dayOfMonth || new Date().getDate());
  const [month, setMonth] = useState(initialValues?.month || new Date().getMonth());
  const [startDate, setStartDate] = useState<Date>(
    initialValues?.startDate
      ? new Date(initialValues.startDate)
      : new Date()
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialValues?.endDate
      ? new Date(initialValues.endDate)
      : null
  );
  const [autoGenerate, setAutoGenerate] = useState(
    initialValues?.autoGenerate !== undefined ? initialValues.autoGenerate : true
  );
  const [requireConfirmation, setRequireConfirmation] = useState(
    initialValues?.requireConfirmation !== undefined ? initialValues.requireConfirmation : false
  );
  
  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  
  // Next occurrences preview
  const [nextOccurrences, setNextOccurrences] = useState<Date[]>([]);
  
  // Calcular próximas ocorrências com base nos parâmetros atuais
  useEffect(() => {
    calculateNextOccurrences();
  }, [frequency, dayOfWeek, dayOfMonth, month, startDate, endDate]);
  
  // Form validation
  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
    description?: string;
    dayOfMonth?: string;
  }>({});
  
  // When the type changes, reset the category
  useEffect(() => {
    setCategory(null);
  }, [type]);
  
  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Não definido';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };
  
  // Handle date selection
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };
  
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };
  
  // Calcular próximas ocorrências
  const calculateNextOccurrences = () => {
    const occurrences: Date[] = [];
    let currentDate = new Date();
    
    // Começar a partir da data de início, se for no futuro
    if (startDate > currentDate) {
      currentDate = new Date(startDate);
    }
    
    // Calcular 5 próximas ocorrências
    for (let i = 0; i < 5; i++) {
      let nextDate: Date | null = null;
      
      switch (frequency) {
        case 'daily':
          nextDate = addDays(currentDate, 1);
          break;
          
        case 'weekly':
          // Calcular próximo dia da semana correspondente
          const daysUntilNextOccurrence = (dayOfWeek - currentDate.getDay() + 7) % 7;
          nextDate = addDays(currentDate, daysUntilNextOccurrence === 0 ? 7 : daysUntilNextOccurrence);
          break;
          
        case 'monthly':
          // Próximo mês, mesmo dia
          nextDate = addMonths(currentDate, 1);
          
          // Ajustar para o dia correto
          const lastDayOfMonth = new Date(
            nextDate.getFullYear(),
            nextDate.getMonth() + 1,
            0
          ).getDate();
          
          // Limitar ao último dia do mês
          nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
          break;
          
        case 'yearly':
          // Se o mês e dia da ocorrência já passou este ano, adicionar um ano
          const targetDate = new Date(currentDate.getFullYear(), month, dayOfMonth);
          
          if (targetDate <= currentDate) {
            nextDate = new Date(currentDate.getFullYear() + 1, month, dayOfMonth);
          } else {
            nextDate = targetDate;
          }
          break;
      }
      
      // Verificar se está além da data de término
      if (endDate && nextDate && nextDate > endDate) {
        break;
      }
      
      if (nextDate) {
        occurrences.push(nextDate);
        currentDate = nextDate;
      }
    }
    
    setNextOccurrences(occurrences);
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {
      amount?: string;
      category?: string;
      description?: string;
      dayOfMonth?: string;
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
    
    if ((frequency === 'monthly' || frequency === 'yearly') && 
        (dayOfMonth < 1 || dayOfMonth > 31)) {
      newErrors.dayOfMonth = 'Dia do mês deve estar entre 1 e 31';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const recurringTransactionData: RecurringTransaction = {
      _id: initialValues?._id,
      type,
      amount,
      description,
      category: category?._id || '',
      frequency,
      startDate: startDate.toISOString(),
      autoGenerate,
      requireConfirmation,
      active: initialValues?.active !== undefined ? initialValues.active : true
    };
    
    // Adicionar campos específicos baseados na frequência
    if (frequency === 'weekly') {
      recurringTransactionData.dayOfWeek = dayOfWeek;
    }
    
    if (frequency === 'monthly' || frequency === 'yearly') {
      recurringTransactionData.dayOfMonth = dayOfMonth;
    }
    
    if (frequency === 'yearly') {
      recurringTransactionData.month = month;
    }
    
    if (endDate) {
      recurringTransactionData.endDate = endDate.toISOString();
    }
    
    onSubmit(recurringTransactionData);
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
            placeholder="Ex: Aluguel, Salário, etc."
            placeholderTextColor={theme.textSecondary}
          />
          {errors.description && (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.description}
            </Text>
          )}
        </View>
        
        {/* Frequency Selector */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Configuração de Recorrência
          </Text>
        </View>
        
        <View style={styles.frequencyContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Frequência</Text>
          <View style={styles.frequencyOptions}>
            {FREQUENCY_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.frequencyOption,
                  frequency === option.value && { 
                    backgroundColor: theme.primary,
                    borderColor: theme.primary
                  },
                  { borderColor: theme.border }
                ]}
                onPress={() => setFrequency(option.value)}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    { color: frequency === option.value ? '#fff' : theme.text }
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Day of Week Selector (for weekly frequency) */}
        {frequency === 'weekly' && (
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Dia da Semana</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayOfWeekContainer}
            >
              {DAYS_OF_WEEK.map(day => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.dayOption,
                    dayOfWeek === day.value && { 
                      backgroundColor: theme.primary,
                      borderColor: theme.primary
                    },
                    { borderColor: theme.border }
                  ]}
                  onPress={() => setDayOfWeek(day.value)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: dayOfWeek === day.value ? '#fff' : theme.text }
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Day of Month Selector (for monthly and yearly frequency) */}
        {(frequency === 'monthly' || frequency === 'yearly') && (
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Dia do Mês</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  color: theme.text,
                  borderColor: errors.dayOfMonth ? theme.error : theme.border,
                  backgroundColor: theme.card
                }
              ]}
              value={dayOfMonth.toString()}
              onChangeText={(text) => {
                const numValue = parseInt(text);
                if (!isNaN(numValue)) {
                  setDayOfMonth(numValue);
                } else if (text === '') {
                  setDayOfMonth(1);
                }
              }}
              keyboardType="numeric"
              placeholder="Dia (1-31)"
              placeholderTextColor={theme.textSecondary}
              maxLength={2}
            />
            {errors.dayOfMonth && (
              <Text style={[styles.errorText, { color: theme.error }]}>
                {errors.dayOfMonth}
              </Text>
            )}
          </View>
        )}
        
        {/* Month Selector (for yearly frequency) */}
        {frequency === 'yearly' && (
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Mês</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthContainer}
            >
              {MONTHS.map(monthOption => (
                <TouchableOpacity
                  key={monthOption.value}
                  style={[
                    styles.monthOption,
                    month === monthOption.value && { 
                      backgroundColor: theme.primary,
                      borderColor: theme.primary
                    },
                    { borderColor: theme.border }
                  ]}
                  onPress={() => setMonth(monthOption.value)}
                >
                  <Text
                    style={[
                      styles.monthText,
                      { color: month === monthOption.value ? '#fff' : theme.text }
                    ]}
                  >
                    {monthOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Start Date Selector */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Data de Início</Text>
          <TouchableOpacity
            style={[
              styles.dateSelector,
              { borderColor: theme.border, backgroundColor: theme.card }
            ]}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Icon name="calendar" size={20} color={theme.primary} />
            <Text style={[styles.dateText, { color: theme.text }]}>
              {formatDate(startDate)}
            </Text>
          </TouchableOpacity>
        </View>
        
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
            minimumDate={new Date()}
          />
        )}
        
        {/* End Date Selector */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Data de Término (opcional)</Text>
          <View style={styles.endDateContainer}>
            <TouchableOpacity
              style={[
                styles.dateSelector,
                { borderColor: theme.border, backgroundColor: theme.card, flex: 1 }
              ]}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Icon name="calendar-end" size={20} color={theme.primary} />
              <Text style={[styles.dateText, { color: theme.text }]}>
                {formatDate(endDate)}
              </Text>
            </TouchableOpacity>
            
            {endDate && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setEndDate(null)}
              >
                <Icon name="close-circle" size={24} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
            minimumDate={startDate}
          />
        )}
        
        {/* Auto Generate Toggle */}
        <View style={styles.optionRow}>
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionLabel, { color: theme.text }]}>
              Gerar Automaticamente
            </Text>
            <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
              Criar transações automaticamente nas datas programadas
            </Text>
          </View>
          <Switch
            value={autoGenerate}
            onValueChange={setAutoGenerate}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={autoGenerate ? theme.primary : '#f4f3f4'}
          />
        </View>
        
        {/* Require Confirmation Toggle */}
        {autoGenerate && (
          <View style={styles.optionRow}>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionLabel, { color: theme.text }]}>
                Requer Confirmação
              </Text>
              <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                Confirmar antes de gerar cada transação
              </Text>
            </View>
            <Switch
              value={requireConfirmation}
              onValueChange={setRequireConfirmation}
              trackColor={{ false: '#767577', true: theme.primary + '80' }}
              thumbColor={requireConfirmation ? theme.primary : '#f4f3f4'}
            />
          </View>
        )}
        
        {/* Next Occurrences Preview */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Próximas Ocorrências
          </Text>
        </View>
        
        <View style={[styles.previewContainer, { backgroundColor: theme.card }]}>
          {nextOccurrences.length > 0 ? (
            nextOccurrences.map((date, index) => (
              <View key={index} style={styles.occurrenceItem}>
                <Icon 
                  name="calendar-clock" 
                  size={16} 
                  color={theme.primary} 
                  style={styles.occurrenceIcon}
                />
                <Text style={[styles.occurrenceText, { color: theme.text }]}>
                  {format(date, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Nenhuma ocorrência futura prevista
            </Text>
          )}
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Atualizar' : 'Criar'} Transação Recorrente
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
    paddingBottom: 32,
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
  sectionHeader: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  frequencyContainer: {
    marginBottom: 16,
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  frequencyOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  frequencyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayOfWeekContainer: {
    paddingBottom: 8,
  },
  dayOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  dayText: {
    fontSize: 14,
  },
  monthContainer: {
    paddingBottom: 8,
  },
  monthOption: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  monthText: {
    fontSize: 14,
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
  endDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    padding: 8,
    marginLeft: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
  },
  optionTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
  previewContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  occurrenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  occurrenceIcon: {
    marginRight: 8,
  },
  occurrenceText: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecurringTransactionForm;