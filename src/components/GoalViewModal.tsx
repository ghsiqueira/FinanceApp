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

interface GoalViewModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  goal: Goal | null;
}

const GoalViewModal: React.FC<GoalViewModalProps> = ({ 
  visible, 
  onClose, 
  onEdit,
  goal 
}) => {
  const { theme, isDark } = useTheme();
  const [addValue, setAddValue] = useState('');
  const queryClient = useQueryClient();
  
  // Animações
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

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

  const updateGoalMutation = useMutation({
    mutationFn: (data: { id: string; currentAmount: number; monthlyTarget: number }) => 
      api.put(`/goals/${data.id}`, { 
        currentAmount: data.currentAmount,
        monthlyTarget: data.monthlyTarget 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (error) => {
      runOnJS(() => Alert.alert('Erro', 'Não foi possível atualizar a meta.'))();
      console.log('Erro ao atualizar meta:', error);
    }
  });

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  const calculateNewMonthlyTarget = (currentAmount: number, targetAmount: number, targetDate: string): number => {
    const remaining = Math.max(0, targetAmount - currentAmount);
    const targetDateObj = new Date(targetDate);
    const now = new Date();
    
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

  const handleAddValue = () => {
    if (!addValue || !goal) {
      Alert.alert('Erro', 'Digite um valor para adicionar');
      return;
    }

    const numericAddValue = parseFloat(addValue.replace(',', '.'));
    if (isNaN(numericAddValue) || numericAddValue <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    const newCurrentAmount = goal.currentAmount + numericAddValue;
    const newMonthlyTarget = calculateNewMonthlyTarget(newCurrentAmount, goal.targetAmount, goal.targetDate);
    
    updateGoalMutation.mutate({
      id: goal._id!,
      currentAmount: newCurrentAmount,
      monthlyTarget: newMonthlyTarget
    });

    setAddValue('');
    runOnJS(() => Alert.alert('Sucesso', `R$ ${numericAddValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} adicionado à meta!\n\nNova meta mensal: R$ ${newMonthlyTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`))();
  };

  const handleRemoveValue = () => {
    if (!addValue || !goal) {
      Alert.alert('Erro', 'Digite um valor para remover');
      return;
    }

    const numericRemoveValue = parseFloat(addValue.replace(',', '.'));
    if (isNaN(numericRemoveValue) || numericRemoveValue <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    if (numericRemoveValue > goal.currentAmount) {
      Alert.alert('Erro', 'Não é possível remover mais do que o valor atual');
      return;
    }

    const newCurrentAmount = Math.max(0, goal.currentAmount - numericRemoveValue);
    const newMonthlyTarget = calculateNewMonthlyTarget(newCurrentAmount, goal.targetAmount, goal.targetDate);
    
    updateGoalMutation.mutate({
      id: goal._id!,
      currentAmount: newCurrentAmount,
      monthlyTarget: newMonthlyTarget
    });

    setAddValue('');
    runOnJS(() => Alert.alert('Sucesso', `R$ ${numericRemoveValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} removido da meta!\n\nNova meta mensal: R$ ${newMonthlyTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`))();
  };

  if (!visible || !goal) return null;

  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const targetDate = new Date(goal.targetDate);
  const currentDate = new Date();
  const daysLeft = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;
  const isAlmostDue = daysLeft <= 30 && daysLeft > 0;
  const isCompleted = progress >= 100;

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
              <Text style={[styles.headerButtonText, { color: theme.colors.textSecondary }]}>
                Fechar
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Detalhes da Meta
            </Text>
            <TouchableOpacity onPress={onEdit} style={styles.headerButton}>
              <Ionicons name="pencil" size={18} color={theme.colors.primary} />
              <Text style={[styles.headerButtonText, { color: theme.colors.primary, marginLeft: 4 }]}>
                Editar
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.form} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Título da Meta */}
            <View style={styles.titleSection}>
              <Text style={[styles.goalTitle, { color: theme.colors.text }]}>
                {goal.title}
              </Text>
              <View style={styles.statusContainer}>
                {isCompleted && (
                  <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.success}20` }]}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={[styles.statusText, { color: theme.colors.success }]}>
                      Concluída
                    </Text>
                  </View>
                )}
                {isOverdue && !isCompleted && (
                  <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.error}20` }]}>
                    <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                    <Text style={[styles.statusText, { color: theme.colors.error }]}>
                      Vencida
                    </Text>
                  </View>
                )}
                {isAlmostDue && !isCompleted && (
                  <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.warning}20` }]}>
                    <Ionicons name="time" size={16} color={theme.colors.warning} />
                    <Text style={[styles.statusText, { color: theme.colors.warning }]}>
                      {daysLeft} dias restantes
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Progress Indicator */}
            <View style={[styles.progressSection, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }]}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
                  📊 Progresso
                </Text>
                <Text style={[styles.progressPercentage, { 
                  color: isCompleted ? theme.colors.success : theme.colors.primary 
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
                      backgroundColor: isCompleted ? theme.colors.success : 
                                     progress >= 75 ? theme.colors.primary :
                                     progress >= 50 ? theme.colors.warning : theme.colors.error
                    }
                  ]} 
                />
              </View>

              <View style={styles.progressDetails}>
                <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                  R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* Informações da Meta */}
            <View style={[styles.infoSection, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                📋 Informações
              </Text>
              
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="flag" size={20} color={theme.colors.primary} />
                  <View style={styles.infoText}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Meta</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                      R$ {goal.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="wallet" size={20} color={theme.colors.success} />
                  <View style={styles.infoText}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Atual</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                      R$ {goal.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="calendar" size={20} color={theme.colors.warning} />
                  <View style={styles.infoText}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Prazo</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                      {new Date(goal.targetDate).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.infoItem}>
                  <Ionicons name="trending-up" size={20} color={theme.colors.error} />
                  <View style={styles.infoText}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Restante</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                      R$ {Math.max(0, goal.targetAmount - goal.currentAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Meta Mensal Atualizada */}
            <View style={[styles.monthlySection, { 
              backgroundColor: `${theme.colors.primary}10`,
              borderColor: theme.colors.primary 
            }]}>
              <View style={styles.monthlyHeader}>
                <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                <Text style={[styles.monthlyTitle, { color: theme.colors.primary }]}>
                  💡 Meta Mensal Atualizada
                </Text>
              </View>
              <Text style={[styles.monthlyValue, { color: theme.colors.primary }]}>
                R$ {goal.monthlyTarget.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })}
              </Text>
              <Text style={[styles.monthlyDesc, { color: theme.colors.textSecondary }]}>
                Guarde esse valor por mês para atingir sua meta
              </Text>
            </View>

            {/* Ações Rápidas */}
            <View style={[styles.quickActionsSection, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                💰 Ações Rápidas
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
                  disabled={updateGoalMutation.isPending}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {updateGoalMutation.isPending ? 'Salvando...' : 'Adicionar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.warning }]}
                  onPress={handleRemoveValue}
                  disabled={updateGoalMutation.isPending}
                >
                  <Ionicons name="remove" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {updateGoalMutation.isPending ? 'Salvando...' : 'Remover'}
                  </Text>
                </TouchableOpacity>
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
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
  titleSection: {
    padding: 20,
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressDetails: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoSection: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  infoText: {
    marginLeft: 8,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  monthlySection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  monthlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthlyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  monthlyValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  monthlyDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  quickActionsSection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    marginBottom: 16,
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
  actionsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default GoalViewModal;