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
import { Transaction } from '../types';
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

interface EditTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

interface TransactionData {
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringEndDate?: string;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ 
  visible, 
  onClose, 
  transaction 
}) => {
  const { theme, isDark } = useTheme();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recurringEndDate, setRecurringEndDate] = useState('');

  const queryClient = useQueryClient();
  
  // Animações
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  // Preencher formulário quando a transação mudar
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString().replace('.', ','));
      setCategory(transaction.category);
      setDescription(transaction.description);
      
      // Formatar data para DD/MM/AAAA
      const transactionDate = new Date(transaction.date);
      const formattedDate = `${String(transactionDate.getDate()).padStart(2, '0')}/${String(transactionDate.getMonth() + 1).padStart(2, '0')}/${transactionDate.getFullYear()}`;
      setDate(formattedDate);
      
      setIsRecurring(transaction.isRecurring || false);
      setRecurringFrequency(transaction.recurringFrequency || 'monthly');
      
      if (transaction.recurringEndDate) {
        const endDate = new Date(transaction.recurringEndDate);
        const formattedEndDate = `${String(endDate.getDate()).padStart(2, '0')}/${String(endDate.getMonth() + 1).padStart(2, '0')}/${endDate.getFullYear()}`;
        setRecurringEndDate(formattedEndDate);
      } else {
        setRecurringEndDate('');
      }
    }
  }, [transaction]);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
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

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; transaction: TransactionData }) => 
      api.put(`/transactions/${data.id}`, data.transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      runOnJS(onClose)();
      runOnJS(() => Alert.alert('Sucesso', 'Transação atualizada com sucesso!'))();
    },
    onError: (error) => {
      runOnJS(() => Alert.alert('Erro', 'Não foi possível atualizar a transação. Tente novamente.'))();
      console.log('Erro ao atualizar transação:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      runOnJS(onClose)();
      runOnJS(() => Alert.alert('Sucesso', 'Transação excluída com sucesso!'))();
    },
    onError: (error) => {
      runOnJS(() => Alert.alert('Erro', 'Não foi possível excluir a transação. Tente novamente.'))();
      console.log('Erro ao excluir transação:', error);
    }
  });

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    const categories = newType === 'income' ? incomeCategories : expenseCategories;
    if (!categories.includes(category)) {
      setCategory(categories[0]);
    }
  };

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  const handleUpdate = () => {
    if (!amount || !description || !date) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    // Validar formato de data DD/MM/AAAA
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Erro', 'Data deve estar no formato DD/MM/AAAA');
      return;
    }

    // Converter data para formato ISO
    const [day, month, year] = date.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const transactionData: TransactionData = {
      type,
      amount: numericAmount,
      category,
      description,
      date: new Date(isoDate).toISOString(),
      isRecurring,
      ...(isRecurring && {
        recurringFrequency,
        ...(recurringEndDate && { 
          recurringEndDate: (() => {
            const [d, m, y] = recurringEndDate.split('/');
            return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`).toISOString();
          })()
        })
      })
    };

    if (!transaction?._id) return;

    updateMutation.mutate({
      id: transaction._id,
      transaction: transactionData
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Esta ação não pode ser desfeita. Deseja realmente excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            if (transaction?._id) {
              deleteMutation.mutate(transaction._id);
            }
          }
        }
      ]
    );
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Diário' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'yearly', label: 'Anual' }
  ];

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  if (!visible || !transaction) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <Animated.View 
        style={[styles.overlay, backgroundStyle]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

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
              Editar Transação
            </Text>
            <TouchableOpacity 
              onPress={handleUpdate} 
              style={styles.headerButton}
              disabled={updateMutation.isPending}
            >
              <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
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

            {/* Data */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Data *
              </Text>
              <DatePickerModal
                value={date}
                onDateSelect={setDate}
                placeholder="Selecione uma data"
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
                </View>
              )}
            </View>

            {/* Botão de Excluir */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={[styles.deleteButton, { 
                  backgroundColor: `${theme.colors.error}15`,
                  borderColor: theme.colors.error,
                }]}
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Ionicons name="trash" size={20} color={theme.colors.error} />
                <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
                  {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Transação'}
                </Text>
              </TouchableOpacity>
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditTransactionModal;