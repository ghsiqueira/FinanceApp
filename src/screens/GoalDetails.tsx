// src/screens/GoalDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  Modal
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useGoals } from '../context/GoalContext';
import { Goal } from '../types';
import { formatCurrency } from '../utils/formatters';
import { useFinancialPlan } from '../context/FinancialPlanContext';
import AmountInput from '../components/AmountInput';

interface RouteParams {
  goalId: string;
}

const GoalDetails = () => {
  const route = useRoute();
  const { goalId } = route.params as RouteParams;
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { goals, addAmountToGoal, deleteGoal, loading } = useGoals();
  const { financialPlan, handleGoalCompletion } = useFinancialPlan();
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState(0);
  
  // Find goal in the context
  useEffect(() => {
    const foundGoal = goals.find(g => g._id === goalId);
    
    if (foundGoal) {
      setGoal(foundGoal);
    }
  }, [goalId, goals]);
  
  // Handle edit goal
  const handleEdit = () => {
    if (goal) {
      navigation.navigate('AddGoal', { goal });
    }
  };
  
  // Handle delete goal
  const handleDelete = () => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            if (!goal?._id) return;
            
            setDeleting(true);
            try {
              await deleteGoal(goal._id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Erro', 'Não foi possível excluir a meta.');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  // Handle add funds to goal
  const handleAddFunds = async () => {
    if (!goal?._id || amountToAdd <= 0) return;
    
    try {
      const updatedGoal = await addAmountToGoal(goal._id, amountToAdd);
      
      setShowAddFundsModal(false);
      setAmountToAdd(0);
      
      // Se a meta foi concluída e tem redistribuição automática ativada
      if (updatedGoal.isCompleted && updatedGoal.autoRedistribute) {
        await handleGoalCompletion(updatedGoal._id);
      }
      
      // Show success message
      Alert.alert(
        'Sucesso',
        'Valor adicionado com sucesso!'
      );
    } catch (error) {
      console.error('Error adding funds to goal:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o valor.');
    }
  };

  
  // Loading state
  if (loading || !goal) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  // Calculate progress
  const progress = goal.targetAmount > 0 
    ? Math.min(goal.currentAmount / goal.targetAmount, 1) 
    : 0;
  
  const progressPercentage = Math.round(progress * 100);
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  
  // Format deadline
  const formattedDeadline = goal.deadline 
    ? format(new Date(goal.deadline), 'dd MMMM yyyy', { locale: ptBR })
    : 'Sem data limite';
  
  // Get category information
  const category = typeof goal.category === 'object' 
    ? goal.category 
    : null;
    
  const categoryName = category ? category.name : '';
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={[
        styles.header, 
        { backgroundColor: goal.color + '20' }
      ]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {goal.title}
        </Text>
        
        {goal.isCompleted && (
          <View style={[styles.completedBadge, { backgroundColor: theme.success }]}>
            <Icon name="check" size={14} color="#fff" />
            <Text style={styles.completedText}>Concluída</Text>
          </View>
        )}
      </View>
      
      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.amountsRow}>
          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
              Valor atual
            </Text>
            <Text style={[styles.currentAmount, { color: theme.primary }]}>
              {formatCurrency(goal.currentAmount)}
            </Text>
          </View>
          
          <View style={styles.progressTextContainer}>
            <Text style={[
              styles.progressText, 
              { color: goal.isCompleted ? theme.success : theme.text }
            ]}>
              {goal.isCompleted ? 'Meta alcançada!' : `${progressPercentage}%`}
            </Text>
          </View>
          
          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
              Valor alvo
            </Text>
            <Text style={[styles.targetAmount, { color: theme.textSecondary }]}>
              {formatCurrency(goal.targetAmount)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
          <View 
            style={[
              styles.progressBar, 
              { backgroundColor: goal.color, width: `${progressPercentage}%` }
            ]}
          />
        </View>
        
        {!goal.isCompleted && (
          <Text style={[styles.remainingText, { color: theme.textSecondary }]}>
            Faltam {formatCurrency(remaining)} para atingir a meta
          </Text>
        )}
      </View>
      
      {/* Details */}
      <View style={[styles.detailsContainer, { backgroundColor: theme.card }]}>
        {/* Deadline */}
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Icon name="calendar" size={20} color={theme.primary} />
          </View>
          <View style={styles.detailContent}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Data limite
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {formattedDeadline}
            </Text>
          </View>
        </View>
        
        {/* Category */}
        {categoryName && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon name="tag" size={20} color={theme.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Categoria
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {categoryName}
              </Text>
            </View>
          </View>
        )}
        
        {/* Creation Date */}
        {goal.createdAt && (
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon name="clock-outline" size={20} color={theme.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                Criado em
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {format(
                  new Date(goal.createdAt),
                  'dd/MM/yyyy HH:mm',
                  { locale: ptBR }
                )}
              </Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!goal.isCompleted && (
          <TouchableOpacity
            style={[styles.addFundsButton, { backgroundColor: theme.success }]}
            onPress={() => setShowAddFundsModal(true)}
          >
            <Icon name="cash-plus" size={20} color="#fff" />
            <Text style={styles.buttonText}>Adicionar Valor</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.primary }]}
          onPress={handleEdit}
          disabled={deleting}
        >
          <Icon name="pencil" size={20} color="#fff" />
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.error }]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="delete" size={20} color="#fff" />
              <Text style={styles.buttonText}>Excluir</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Add Funds Modal */}
      <Modal
        visible={showAddFundsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddFundsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Adicionar valor à meta
            </Text>
            
            <AmountInput
              value={amountToAdd}
              onChange={setAmountToAdd}
              label="Valor a adicionar"
              isIncome={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => {
                  setShowAddFundsModal(false);
                  setAmountToAdd(0);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.confirmButton, 
                  { backgroundColor: theme.success }
                ]}
                onPress={handleAddFunds}
                disabled={amountToAdd <= 0}
              >
                <Text style={styles.confirmButtonText}>
                  Adicionar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Priority */}
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Icon name="priority-high" size={20} color={theme.primary} />
          </View>
          <View style={styles.detailContent}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Prioridade
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {goal.priority === 1 ? 'Muito alta' : 
              goal.priority === 2 ? 'Alta' :
              goal.priority === 3 ? 'Média' :
              goal.priority === 4 ? 'Baixa' : 'Muito baixa'}
            </Text>
          </View>
        </View>

        {/* Monthly Contribution */}
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Icon name="cash-multiple" size={20} color={theme.primary} />
          </View>
          <View style={styles.detailContent}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Contribuição mensal sugerida
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {formatCurrency(goal.monthlyContribution)}
            </Text>
          </View>
        </View>

        {/* Auto Redistribute */}
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Icon name="refresh" size={20} color={theme.primary} />
          </View>
          <View style={styles.detailContent}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Redistribuição automática
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {goal.autoRedistribute ? 'Ativada' : 'Desativada'}
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  completedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  progressSection: {
    marginBottom: 16,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountContainer: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  currentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  targetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressTextContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  remainingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  detailsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  addFundsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    marginRight: 8,
  },
  confirmButton: {
    marginLeft: 8,
  },
  cancelButtonText: {
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default GoalDetails;