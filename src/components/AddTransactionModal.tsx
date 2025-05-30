import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ModalProps } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import DatePickerModal from './DatePickerModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Categorias específicas por tipo
const incomeCategories = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Dividendos',
  'Aluguel Recebido',
  'Vendas',
  'Prêmios',
  'Cashback',
  'Outros'
];

const expenseCategories = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Roupas',
  'Tecnologia',
  'Viagem',
  'Pets',
  'Presentes',
  'Streaming',
  'Assinaturas',
  'Outros'
];

interface TransactionData {
  type: string;
  amount: number;
  category: string;
  description: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: string;
}

const AddTransactionModal: React.FC<ModalProps> = ({ visible, onClose }) => {
  const { theme, isDark } = useTheme();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(expenseCategories[0]);
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recurringEndDate, setRecurringEndDate] = useState('');

  const queryClient = useQueryClient();
  
  // Animações
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Mostrar modal
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      // Esconder modal
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    }
  }, [visible]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const addMutation = useMutation({
    mutationFn: (data: TransactionData) => api.post('/transactions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      resetForm();
      runOnJS(onClose)();
      runOnJS(() => Alert.alert('Sucesso', isRecurring ? 'Transação recorrente criada!' : 'Transação adicionada'))();
    },
    onError: (error) => {
      runOnJS(() => Alert.alert('Erro', 'Não foi possível adicionar a transação. Tente novamente.'))();
      console.log('Erro ao adicionar transação:', error);
    }
  });

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setCategory(expenseCategories[0]);
    setDescription('');
    setIsRecurring(false);
    setRecurringFrequency('monthly');
    setRecurringEndDate('');
  };

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(newType === 'income' ? incomeCategories[0] : expenseCategories[0]);
  };

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  const handleSubmit = () => {
    if (!amount || !description) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    const transactionData: TransactionData = {
      type,
      amount: numericAmount,
      category,
      description,
      isRecurring,
      ...(isRecurring && {
        recurringFrequency,
        ...(recurringEndDate && { 
          recurringEndDate: (() => {
            const [day, month, year] = recurringEndDate.split('/');
            return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`).toISOString();
          })()
        })
      })
    };

    if (isRecurring && !recurringEndDate) {
      Alert.alert(
        'Transação Recorrente',
        'Você não definiu uma data limite. Esta transação será recorrente por tempo indeterminado. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => addMutation.mutate(transactionData) }
        ]
      );
    } else {
      addMutation.mutate(transactionData);
    }
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Diário' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'yearly', label: 'Anual' }
  ];

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Background Overlay */}
      <Animated.View 
        style={[styles.overlay, backgroundStyle]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View style={[styles.modalContainer, modalStyle]}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { 
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border 
          }]}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, { color: theme.colors.error }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Nova Transação
            </Text>
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={styles.headerButton}
              disabled={addMutation.isPending}
            >
              <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>
                {addMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.form} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Tipo de Transação */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Tipo da Transação
              </Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: type === 'income' ? theme.colors.success : theme.colors.border }
                  ]}
                  onPress={() => handleTypeChange('income')}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="trending-up" 
                    size={24} 
                    color={type === 'income' ? '#FFFFFF' : theme.colors.textSecondary} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    { 
                      color: type === 'income' ? '#FFFFFF' : theme.colors.textSecondary,
                      fontWeight: type === 'income' ? 'bold' : '500'
                    }
                  ]}>
                    Receita
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: type === 'expense' ? theme.colors.error : theme.colors.border }
                  ]}
                  onPress={() => handleTypeChange('expense')}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="trending-down" 
                    size={24} 
                    color={type === 'expense' ? '#FFFFFF' : theme.colors.textSecondary} 
                  />
                  <Text style={[
                    styles.typeButtonText,
                    { 
                      color: type === 'expense' ? '#FFFFFF' : theme.colors.textSecondary,
                      fontWeight: type === 'expense' ? 'bold' : '500'
                    }
                  ]}>
                    Despesa
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Valor */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Valor *
              </Text>
              <View style={[styles.inputContainer, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }]}>
                <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>
                  R$
                </Text>
                <TextInput
                  style={[styles.amountInput, { color: theme.colors.text }]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0,00"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Categoria */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Categoria
              </Text>
              <View style={[styles.pickerContainer, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border 
              }]}>
                <Picker
                  selectedValue={category}
                  onValueChange={setCategory}
                  style={{ color: theme.colors.text }}
                >
                  {currentCategories.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Descrição */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Descrição *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border 
                }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Digite uma descrição"
                placeholderTextColor={theme.colors.textSecondary}
                multiline={true}
                numberOfLines={2}
              />
            </View>

            {/* Transação Recorrente */}
            <View style={[styles.section, styles.recurringSection, {
              borderTopColor: theme.colors.border
            }]}>
              <View style={styles.recurringHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    💰 Transação Recorrente
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    Repete automaticamente no período selecionado
                  </Text>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={theme.colors.surface}
                  ios_backgroundColor={theme.colors.border}
                />
              </View>

              {isRecurring && (
                <View style={styles.recurringOptions}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Frequência
                  </Text>
                  <View style={styles.frequencyContainer}>
                    {frequencyOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.frequencyButton,
                          { 
                            backgroundColor: recurringFrequency === option.value 
                              ? theme.colors.primary 
                              : theme.colors.border 
                          }
                        ]}
                        onPress={() => setRecurringFrequency(option.value as any)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.frequencyButtonText,
                          {
                            color: recurringFrequency === option.value 
                              ? '#FFFFFF' 
                              : theme.colors.textSecondary,
                            fontWeight: recurringFrequency === option.value ? 'bold' : '500'
                          }
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Data Limite (Opcional)
                  </Text>
                  <DatePickerModal
                    value={recurringEndDate}
                    onDateSelect={setRecurringEndDate}
                    placeholder="Selecione uma data limite"
                  />

                  <View style={[styles.warningBox, { 
                    backgroundColor: `${theme.colors.warning}15`,
                    borderColor: theme.colors.warning,
                  }]}>
                    <Ionicons name="information-circle" size={16} color={theme.colors.warning} />
                    <Text style={[styles.warningText, { color: theme.colors.warning }]}>
                      Se não definir uma data limite, a transação será recorrente por tempo indeterminado
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
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
  headerButton: {
    minWidth: 80,
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  typeButtonText: {
    fontSize: 16,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recurringSection: {
    borderTopWidth: 1,
    marginTop: 8,
  },
  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recurringOptions: {
    paddingTop: 16,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  frequencyButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  frequencyButtonText: {
    fontSize: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default AddTransactionModal;