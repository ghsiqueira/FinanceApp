import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
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
import { Goal } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EditGoalModalProps {
  visible: boolean;
  onClose: () => void;
  goal: Goal | null;
}

interface GoalData {
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyTarget: number;
}

const EditGoalModal: React.FC<EditGoalModalProps> = ({ 
  visible, 
  onClose, 
  goal 
}) => {
  const { theme, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [addValue, setAddValue] = useState('');

  const queryClient = useQueryClient();
  
  // Animações
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  // Preencher formulário quando a meta mudar
  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setTargetAmount(goal.targetAmount.toString().replace('.', ','));
      setCurrentAmount(goal.currentAmount.toString().replace('.', ','));
      
      // Formatar data para DD/MM/AAAA
      const goalDate = new Date(goal.targetDate);
      const formattedDate = `${String(goalDate.getDate()).padStart(2, '0')}/${String(goalDate.getMonth() + 1).padStart(2, '0')}/${goalDate.getFullYear()}`;
      setTargetDate(formattedDate);
    }
  }, [goal]);

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
    mutationFn: (data: { id: string; goal: GoalData }) => 
      api.put(`/goals/${data.id}`, data.goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      runOnJS(onClose)();
      runOnJS(() => Alert.alert('Sucesso', 'Meta atualizada com sucesso!'))();
    },
    onError: (error) => {
      runOnJS(() => Alert.alert('Erro', 'Não foi possível atualizar a meta. Tente novamente.'))();
      console.log('Erro ao atualizar meta:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      runOnJS(onClose)();
      runOnJS(() => Alert.alert('Sucesso', 'Meta excluída com sucesso!'))();
    },
    onError: (error) => {
      runOnJS(() => Alert.alert('Erro', 'Não foi possível excluir a meta. Tente novamente.'))();
      console.log('Erro ao excluir meta:', error);
    }
  });

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  const calculateNewMonthlyTarget = (currentAmount: number, targetAmount: number, targetDate: string): number => {
    if (isNaN(currentAmount) || isNaN(targetAmount)) {
      return 0;
    }
    const remaining = Math.max(0, targetAmount - currentAmount);
    const targetDateObj = new Date(targetDate);
    const now = new Date();

    if (isNaN(targetDateObj.getTime())) { // Data inválida
      return 0;
    }
    
    // CÁLCULO MAIS PRECISO DE MESES
    let monthsDiff = (targetDateObj.getFullYear() - now.getFullYear()) * 12 + 
                     (targetDateObj.getMonth() - now.getMonth());
    
    // Se o dia da meta ainda não passou no mês atual, soma 1 mês
    if (targetDateObj.getDate() > now.getDate()) {
      monthsDiff += 1;
    }
    
    // Garantir pelo menos 1 mês
    monthsDiff = Math.max(monthsDiff, 1);
    
    // Arredondar para 2 casas decimais
    const monthlyTarget = remaining / monthsDiff;
    return Math.round(monthlyTarget * 100) / 100;
  };

  const handleUpdate = () => {
    if (!title || !targetAmount || !targetDate) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const numericTargetAmount = parseFloat(targetAmount.replace(',', '.'));
    const numericCurrentAmount = parseFloat(currentAmount.replace(',', '.')) || 0;

    if (isNaN(numericTargetAmount) || numericTargetAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor alvo válido');
      return;
    }

    if (numericCurrentAmount < 0) {
      Alert.alert('Erro', 'O valor atual não pode ser negativo');
      return;
    }

    // Validar formato de data DD/MM/AAAA
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(targetDate)) {
      Alert.alert('Erro', 'Data deve estar no formato DD/MM/AAAA');
      return;
    }

    // Converter data para formato ISO
    const [day, month, year] = targetDate.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const monthlyTarget = calculateNewMonthlyTarget(numericCurrentAmount, numericTargetAmount, isoDate);

    if (isNaN(monthlyTarget)) {
      Alert.alert('Erro', 'Não foi possível calcular a nova meta mensal');
      return;
    }

    const goalData: GoalData = {
      title,
      targetAmount: numericTargetAmount,
      currentAmount: numericCurrentAmount,
      targetDate: new Date(isoDate).toISOString(),
      monthlyTarget
    };

    if (!goal?._id) return;

    updateMutation.mutate({
      id: goal._id,
      goal: goalData
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Esta ação não pode ser desfeita. Deseja realmente excluir esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => {
            if (goal?._id) {
              deleteMutation.mutate(goal._id);
            }
          }
        }
      ]
    );
  };

  const handleAddValue = () => {
    if (!addValue) {
      Alert.alert('Erro', 'Digite um valor para adicionar');
      return;
    }

    const numericAddValue = parseFloat(addValue.replace(',', '.'));
    if (isNaN(numericAddValue) || numericAddValue <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    const currentNumericAmount = parseFloat(currentAmount.replace(',', '.')) || 0;
    const targetNumericAmount = parseFloat(targetAmount.replace(',', '.')) || 0;

    if (isNaN(targetNumericAmount) || isNaN(currentNumericAmount)) {
      Alert.alert('Erro', 'Valores inválidos para o cálculo da meta mensal');
      return;
    }

    const newCurrentAmount = currentNumericAmount + numericAddValue;

    // Converter targetDate para ISO para cálculo correto
    const [day, month, year] = targetDate.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    const newMonthlyTarget = calculateNewMonthlyTarget(newCurrentAmount, targetNumericAmount, isoDate);
    
    setCurrentAmount(newCurrentAmount.toString().replace('.', ','));
    setAddValue('');
    
    Alert.alert(
      'Sucesso', 
      `R$ ${numericAddValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} adicionado à meta!\n\nNova meta mensal: R$ ${newMonthlyTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    );
  };

  const handleRemoveValue = () => {
    if (!addValue) {
      Alert.alert('Erro', 'Digite um valor para remover');
      return;
    }

    const numericRemoveValue = parseFloat(addValue.replace(',', '.'));
    if (isNaN(numericRemoveValue) || numericRemoveValue <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    const currentNumericAmount = parseFloat(currentAmount.replace(',', '.')) || 0;
    const targetNumericAmount = parseFloat(targetAmount.replace(',', '.')) || 0;

    if (numericRemoveValue > currentNumericAmount) {
      Alert.alert('Erro', 'Não é possível remover mais do que o valor atual');
      return;
    }

    if (isNaN(targetNumericAmount) || isNaN(currentNumericAmount)) {
      Alert.alert('Erro', 'Valores inválidos para o cálculo da meta mensal');
      return;
    }

    const newCurrentAmount = Math.max(0, currentNumericAmount - numericRemoveValue);

    const [day, month, year] = targetDate.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    const newMonthlyTarget = calculateNewMonthlyTarget(newCurrentAmount, targetNumericAmount, isoDate);
    
    setCurrentAmount(newCurrentAmount.toString().replace('.', ','));
    setAddValue('');
    
    Alert.alert(
      'Sucesso', 
      `R$ ${numericRemoveValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} removido da meta!\n\nNova meta mensal: R$ ${newMonthlyTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    );
  };

  const progress = goal ? (parseFloat(currentAmount.replace(',', '.')) / parseFloat(targetAmount.replace(',', '.'))) * 100 : 0;

  if (!visible || !goal) return null;

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
              Editar Meta
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
            {/* Progress Indicator */}
            <View style={[styles.progressSection, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
                  📊 Progresso Atual
                </Text>
                <Text style={[styles.progressPercentage, { 
                  color: progress >= 100 ? theme.colors.success : theme.colors.primary 
                }]}>
                  {progress.toFixed(1)}%
                </Text>
              </View>
              
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(progress, 100)}%`,
                      backgroundColor: progress >= 100 ? theme.colors.success : 
                                     progress >= 75 ? theme.colors.primary :
                                     progress >= 50 ? theme.colors.warning : theme.colors.error
                    }
                  ]} 
                />
              </View>

              <View style={styles.progressDetails}>
                <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                  R$ {(parseFloat(currentAmount.replace(',', '.')) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {(parseFloat(targetAmount.replace(',', '.')) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                💰 Ações Rápidas
              </Text>
              
              <View style={[styles.quickActionsContainer, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }]}>
                <Text style={[styles.quickActionsTitle, { color: theme.colors.text }]}>
                  Adicionar/Remover Valor
                </Text>
                
                <View style={[styles.inputContainer, {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border
                }]}>
                  <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>
                    R$
                  </Text>
                  <TextInput
                    style={[styles.amountInput, { color: theme.colors.text }]}
                    value={addValue}
                    onChangeText={setAddValue}
                    placeholder="0,00"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.actionsButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                    onPress={handleAddValue}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Adicionar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
                    onPress={handleRemoveValue}
                  >
                    <Ionicons name="remove" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Nome da Meta */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Nome da Meta *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.surface, 
                  color: theme.colors.text,
                  borderColor: theme.colors.border 
                }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Viagem para Europa"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            {/* Valor Alvo */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Valor Alvo *
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
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0,00"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Valor Atual */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Valor Atual
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
                  value={currentAmount}
                  onChangeText={setCurrentAmount}
                  placeholder="0,00"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Data Limite */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Data Limite *
              </Text>
              <View style={[styles.inputContainer, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }]}>
                <Ionicons 
                  name="calendar" 
                  size={20} 
                  color={theme.colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={[styles.dateInput, { color: theme.colors.text }]}
                  value={targetDate}
                  onChangeText={setTargetDate}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            {/* Info Box */}
            <View style={[styles.infoBox, { 
              backgroundColor: `${theme.colors.primary}10`,
              borderColor: theme.colors.primary 
            }]}>
              <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.primary }]}>
                💡 Com base na data limite, você precisará guardar R$ {
                  targetAmount && targetDate && currentAmount ? 
                  calculateNewMonthlyTarget(
                    parseFloat(currentAmount.replace(',', '.')) || 0,
                    parseFloat(targetAmount.replace(',', '.')),
                    (() => {
                      const [day, month, year] = targetDate.split('/');
                      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    })()
                  ).toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  }) : '0,00'
                } por mês
              </Text>
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
                  {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Meta'}
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
  progressSection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressDetails: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
  },
  quickActionsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionsButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
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

export default EditGoalModal;