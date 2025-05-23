// src/components/GoalForm.tsx - Atualização para incluir prioridade
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  Switch
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../context/CategoryContext';
import { Goal, Category } from '../types';
import { CATEGORY_COLORS } from '../constants';
import AmountInput from './AmountInput';
import CategorySelector from './CategorySelector';
import Slider from '@react-native-community/slider'; // Certifique-se de instalar esta dependência

interface GoalFormProps {
  initialValues?: Partial<Goal>;
  onSubmit: (goal: Goal) => void;
  isEditing?: boolean;
  monthlyIncome?: number; // Nova prop para ajudar a calcular valores sugeridos
}

const GoalForm: React.FC<GoalFormProps> = ({
  initialValues,
  onSubmit,
  isEditing = false,
  monthlyIncome = 0
}) => {
  const { theme } = useTheme();
  const { categories } = useCategories();
  
  // Form state existente
  const [title, setTitle] = useState<string>(initialValues?.title || '');
  const [targetAmount, setTargetAmount] = useState<number>(initialValues?.targetAmount || 0);
  const [currentAmount, setCurrentAmount] = useState<number>(initialValues?.currentAmount || 0);
  const [color, setColor] = useState<string>(initialValues?.color || CATEGORY_COLORS[0]);
  const [category, setCategory] = useState<Category | null>(
    typeof initialValues?.category === 'object' 
      ? initialValues.category 
      : null
  );
  const [deadline, setDeadline] = useState<Date | null>(
    initialValues?.deadline 
      ? new Date(initialValues.deadline) 
      : null
  );
  
  // Novos campos para o planejamento
  const [priority, setPriority] = useState<number>(initialValues?.priority || 3); // Padrão: prioridade média
  const [monthlyContribution, setMonthlyContribution] = useState<number>(
    initialValues?.monthlyContribution || 0
  );
  const [autoRedistribute, setAutoRedistribute] = useState<boolean>(
    initialValues?.autoRedistribute !== undefined ? initialValues.autoRedistribute : true
  );
  
  // Estados UI existentes
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  
  // Form validation
  const [errors, setErrors] = useState<{
    title?: string;
    targetAmount?: string;
    currentAmount?: string;
    monthlyContribution?: string;
  }>({});
  
  // Calcular contribuição mensal sugerida quando target ou deadline mudarem
  useEffect(() => {
    if (targetAmount > 0 && deadline) {
      const today = new Date();
      const monthsUntilDeadline = 
        (deadline.getFullYear() - today.getFullYear()) * 12 + 
        (deadline.getMonth() - today.getMonth());
      
      if (monthsUntilDeadline > 0) {
        const remaining = targetAmount - currentAmount;
        const suggested = remaining / monthsUntilDeadline;
        
        // Arredondar para duas casas decimais
        setMonthlyContribution(Math.round(suggested * 100) / 100);
      }
    }
  }, [targetAmount, deadline, currentAmount]);
  
  // Funções de manipulação existentes
  // ...

  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDeadline(selectedDate);
    }
  };
  
  // Format date for display
  const formattedDate = deadline 
    ? deadline.toLocaleDateString('pt-BR') 
    : 'Sem data limite';
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {
      title?: string;
      targetAmount?: string;
      currentAmount?: string;
      monthlyContribution?: string;
    } = {};
    
    if (!title.trim()) {
      newErrors.title = 'O título é obrigatório';
    }
    
    if (targetAmount <= 0) {
      newErrors.targetAmount = 'O valor alvo deve ser maior que zero';
    }
    
    if (currentAmount < 0) {
      newErrors.currentAmount = 'O valor atual não pode ser negativo';
    }
    
    if (currentAmount > targetAmount) {
      newErrors.currentAmount = 'O valor atual não pode ser maior que o valor alvo';
    }
    
    if (monthlyContribution < 0) {
      newErrors.monthlyContribution = 'A contribuição mensal não pode ser negativa';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      const goal: Goal = {
        _id: initialValues?._id,
        title,
        targetAmount,
        currentAmount,
        color,
        category: category?._id || '',
        isCompleted: currentAmount >= targetAmount,
        deadline: deadline ? deadline.toISOString() : undefined,
        // Novos campos
        priority,
        monthlyContribution,
        autoRedistribute
      };
      
      onSubmit(goal);
    }
  };
  
  // Helper para renderizar o texto de prioridade
  const getPriorityText = (value: number): string => {
    switch (value) {
      case 1: return 'Muito Alta';
      case 2: return 'Alta';
      case 3: return 'Média';
      case 4: return 'Baixa';
      case 5: return 'Muito Baixa';
      default: return 'Média';
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
        {/* Campos existentes */}
        {/* ... */}

        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Título da Meta</Text>
          <TextInput
            style={[
              styles.input,
              { 
                color: theme.text,
                borderColor: errors.title ? theme.error : theme.border,
                backgroundColor: theme.card
              }
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Comprar um carro, Férias, etc."
            placeholderTextColor={theme.textSecondary}
          />
          {errors.title && (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.title}
            </Text>
          )}
        </View>
        
        {/* Target Amount Input */}
        <AmountInput 
          value={targetAmount}
          onChange={setTargetAmount}
          label="Valor Alvo"
          error={errors.targetAmount}
          isIncome={true}
        />
        
        {/* Current Amount Input */}
        <AmountInput 
          value={currentAmount}
          onChange={setCurrentAmount}
          label="Valor Atual (opcional)"
          error={errors.currentAmount}
          isIncome={true}
        />
        
        {/* Category Selector (Optional) */}
        <Text style={[styles.optionalLabel, { color: theme.textSecondary }]}>
          Campos Opcionais
        </Text>
        
        <CategorySelector 
          selectedCategory={category}
          onSelectCategory={setCategory}
          transactionType="expense"
          error={undefined}
        />
        
        {/* Date Selector */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Data Limite (opcional)</Text>
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
            {deadline && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setDeadline(null)}
              >
                <Icon name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
        
        {showDatePicker && (
          <DateTimePicker
            value={deadline || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
        
        {/* Novo: Priority Selector */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Prioridade</Text>
          <View style={styles.priorityContainer}>
            <Text style={[styles.priorityText, { color: theme.textSecondary }]}>
              {getPriorityText(priority)}
            </Text>
            <Slider
              style={styles.prioritySlider}
              minimumValue={1}
              maximumValue={5}
              step={1}
              value={priority}
              onValueChange={setPriority}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.primary}
            />
            <View style={styles.priorityLabels}>
              <Text style={[styles.priorityLabel, { color: theme.textSecondary }]}>Alta</Text>
              <Text style={[styles.priorityLabel, { color: theme.textSecondary }]}>Baixa</Text>
            </View>
          </View>
        </View>
        
        {/* Novo: Monthly Contribution Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>
            Contribuição Mensal Sugerida
          </Text>
          <AmountInput 
            value={monthlyContribution}
            onChange={setMonthlyContribution}
            error={errors.monthlyContribution}
            isIncome={true}
          />
          {deadline && (
            <Text style={[styles.contributionHint, { color: theme.textSecondary }]}>
              Valor mensal necessário para atingir a meta até {formattedDate}
            </Text>
          )}
        </View>
        
        {/* Novo: Auto Redistribute Toggle */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleTextContainer}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>
              Redistribuir automaticamente
            </Text>
            <Text style={[styles.toggleDescription, { color: theme.textSecondary }]}>
              Quando esta meta for concluída, o valor excedente será distribuído para outras metas
            </Text>
          </View>
          <Switch
            value={autoRedistribute}
            onValueChange={setAutoRedistribute}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={autoRedistribute ? theme.primary : '#f4f3f4'}
          />
        </View>
        
        {/* Color Picker */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Cor</Text>
          <TouchableOpacity
            style={[
              styles.colorButton,
              { borderColor: theme.border, backgroundColor: theme.card }
            ]}
            onPress={() => setShowColorPicker(true)}
          >
            <View style={[styles.colorPreview, { backgroundColor: color }]} />
            <Text style={[styles.colorButtonText, { color: theme.text }]}>
              Selecionar Cor
            </Text>
          </TouchableOpacity>
        </View>
                
        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Atualizar' : 'Criar'} Meta
          </Text>
        </TouchableOpacity>
        
        {/* Color Picker Modal */}
        <Modal
          visible={showColorPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowColorPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowColorPicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.colorPickerContainer, { backgroundColor: theme.card }]}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Escolha uma cor
                  </Text>
                  <FlatList
                    data={CATEGORY_COLORS}
                    numColumns={4}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.colorItem,
                          { borderColor: item === color ? theme.primary : 'transparent' }
                        ]}
                        onPress={() => {
                          setColor(item);
                          setShowColorPicker(false);
                        }}
                      >
                        <View 
                          style={[
                            styles.colorSwatch, 
                            { backgroundColor: item }
                          ]} 
                        />
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // Estilos existentes
  // ...
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  optionalLabel: {
    fontSize: 14,
    marginBottom: 16,
    marginTop: 8,
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
  colorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  colorButtonText: {
    fontSize: 16,
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
    flex: 1,
  },
  clearButton: {
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  colorPickerContainer: {
    width: '80%',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  colorItem: {
    width: '25%',
    aspectRatio: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 8,
  },
  colorSwatch: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  
  // Novos estilos
  priorityContainer: {
    marginBottom: 8,
  },
  priorityText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  prioritySlider: {
    height: 40,
  },
  priorityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityLabel: {
    fontSize: 12,
  },
  contributionHint: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
  },
});

export default GoalForm;