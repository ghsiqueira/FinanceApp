// src/components/GoalForm.tsx
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
  FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../context/CategoryContext';
import { Goal, Category } from '../types';
import { CATEGORY_COLORS } from '../constants';
import AmountInput from './AmountInput';
import CategorySelector from './CategorySelector';

interface GoalFormProps {
  initialValues?: Partial<Goal>;
  onSubmit: (goal: Goal) => void;
  isEditing?: boolean;
}

const GoalForm: React.FC<GoalFormProps> = ({
  initialValues,
  onSubmit,
  isEditing = false
}) => {
  const { theme } = useTheme();
  const { categories } = useCategories();
  
  // Form state
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
  
  // Form UI state
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  
  // Form validation
  const [errors, setErrors] = useState<{
    title?: string;
    targetAmount?: string;
    currentAmount?: string;
  }>({});
  
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
      };
      
      onSubmit(goal);
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
});

export default GoalForm;