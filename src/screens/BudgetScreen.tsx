// src/screens/BudgetScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../context/CategoryContext';
import { useTransactions } from '../context/TransactionContext';
import MonthSelector from '../components/MonthSelector';
import AmountInput from '../components/AmountInput';
import { formatCurrency } from '../utils/formatters';
import BudgetService, { MonthlyBudget, BudgetCategory } from '../services/budgetService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const BudgetScreen: React.FC = () => {
  const { theme } = useTheme();
  const { expenseCategories } = useCategories();
  const { transactions, fetchTransactions } = useTransactions();
  
  // State management
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentBudget, setCurrentBudget] = useState<MonthlyBudget | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetAmounts, setBudgetAmounts] = useState<Record<string, number>>({});

  const currentMonth = selectedDate.getMonth() + 1;
  const currentYear = selectedDate.getFullYear();

  // Load budget data
  useEffect(() => {
    loadBudgetData();
  }, [selectedDate]);

  const loadBudgetData = async () => {
    setLoading(true);
    try {
      // Buscar orçamento existente
      let budget = await BudgetService.getBudget(currentYear, currentMonth);
      
      if (budget) {
        // Atualizar com transações atuais
        await fetchTransactions();
        budget = await BudgetService.updateBudgetWithTransactions(
          currentYear,
          currentMonth,
          transactions,
          expenseCategories
        );
      }
      
      setCurrentBudget(budget);
    } catch (error) {
      console.error('Erro ao carregar dados do orçamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async () => {
    try {
      // Validar se pelo menos uma categoria tem valor
      const hasValues = Object.values(budgetAmounts).some(amount => amount > 0);
      if (!hasValues) {
        Alert.alert('Erro', 'Defina pelo menos um valor de orçamento para uma categoria.');
        return;
      }

      setLoading(true);
      const categoryBudgets = Object.entries(budgetAmounts)
        .filter(([_, amount]) => amount > 0)
        .map(([categoryId, amount]) => ({ categoryId, amount }));

      const budget = await BudgetService.createOrUpdateBudget(
        currentYear,
        currentMonth,
        categoryBudgets
      );

      // Atualizar com transações
      const updatedBudget = await BudgetService.updateBudgetWithTransactions(
        currentYear,
        currentMonth,
        transactions,
        expenseCategories
      );

      setCurrentBudget(updatedBudget);
      setShowBudgetModal(false);
      setBudgetAmounts({});

      Alert.alert('Sucesso', 'Orçamento criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar orçamento:', error);
      Alert.alert('Erro', 'Não foi possível criar o orçamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromPrevious = async () => {
    try {
      setLoading(true);
      const budget = await BudgetService.createBudgetBasedOnPrevious(currentYear, currentMonth);
      
      if (budget) {
        const updatedBudget = await BudgetService.updateBudgetWithTransactions(
          currentYear,
          currentMonth,
          transactions,
          expenseCategories
        );
        setCurrentBudget(updatedBudget);
        Alert.alert('Sucesso', 'Orçamento criado baseado no mês anterior!');
      } else {
        Alert.alert('Aviso', 'Não foi encontrado orçamento do mês anterior.');
      }
    } catch (error) {
      console.error('Erro ao criar orçamento do mês anterior:', error);
      Alert.alert('Erro', 'Não foi possível criar o orçamento.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este orçamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await BudgetService.deleteBudget(currentYear, currentMonth);
              setCurrentBudget(null);
              Alert.alert('Sucesso', 'Orçamento excluído com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o orçamento.');
            }
          }
        }
      ]
    );
  };

  const renderBudgetSummary = () => {
    if (!currentBudget) return null;

    const overallPercentage = currentBudget.totalBudget > 0 
      ? (currentBudget.totalSpent / currentBudget.totalBudget) * 100 
      : 0;

    return (
      <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.summaryTitle, { color: theme.text }]}>
          Resumo do Orçamento
        </Text>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Orçamento Total:
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {formatCurrency(currentBudget.totalBudget)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Gasto Total:
          </Text>
          <Text style={[styles.summaryValue, { color: theme.error }]}>
            {formatCurrency(currentBudget.totalSpent)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Restante:
          </Text>
          <Text style={[
            styles.summaryValue, 
            { color: currentBudget.totalRemaining >= 0 ? theme.success : theme.error }
          ]}>
            {formatCurrency(currentBudget.totalRemaining)}
          </Text>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
            <View 
              style={[
                styles.progressBar,
                { 
                  backgroundColor: overallPercentage > 100 ? theme.error : theme.primary,
                  width: `${Math.min(overallPercentage, 100)}%`
                }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.text }]}>
            {Math.round(overallPercentage)}% utilizado
          </Text>
        </View>
      </View>
    );
  };

  const renderCategoryBudget = ({ item }: { item: BudgetCategory }) => {
    const getStatusColor = () => {
      switch (item.status) {
        case 'over': return theme.error;
        case 'near': return theme.warning;
        default: return theme.success;
      }
    };

    const getStatusIcon = () => {
      switch (item.status) {
        case 'over': return 'alert-circle';
        case 'near': return 'alert';
        default: return 'check-circle';
      }
    };

    return (
      <View style={[styles.categoryCard, { backgroundColor: theme.card }]}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <View style={[
              styles.categoryIcon,
              { backgroundColor: item.categoryColor + '20' }
            ]}>
              <View style={[
                styles.categoryColorDot,
                { backgroundColor: item.categoryColor }
              ]} />
            </View>
            <Text style={[styles.categoryName, { color: theme.text }]}>
              {item.categoryName}
            </Text>
          </View>
          
          <Icon 
            name={getStatusIcon()} 
            size={20} 
            color={getStatusColor()} 
          />
        </View>
        
        <View style={styles.categoryAmounts}>
          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
              Orçado:
            </Text>
            <Text style={[styles.amountValue, { color: theme.text }]}>
              {formatCurrency(item.budgetAmount)}
            </Text>
          </View>
          
          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
              Gasto:
            </Text>
            <Text style={[styles.amountValue, { color: theme.error }]}>
              {formatCurrency(item.spentAmount)}
            </Text>
          </View>
          
          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
              Restante:
            </Text>
            <Text style={[
              styles.amountValue, 
              { color: item.remainingAmount >= 0 ? theme.success : theme.error }
            ]}>
              {formatCurrency(item.remainingAmount)}
            </Text>
          </View>
        </View>
        
        {/* Category Progress Bar */}
        <View style={styles.categoryProgressContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
            <View 
              style={[
                styles.progressBar,
                { 
                  backgroundColor: getStatusColor(),
                  width: `${Math.min(item.percentage, 100)}%`
                }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.text }]}>
            {Math.round(item.percentage)}%
          </Text>
        </View>
      </View>
    );
  };

  const renderBudgetModal = () => (
    <Modal
      visible={showBudgetModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowBudgetModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Criar Orçamento
            </Text>
            <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
              <Icon name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Defina o orçamento por categoria:
            </Text>
            
            {expenseCategories.map(category => (
              <View key={category._id} style={styles.budgetInputRow}>
                <View style={styles.categoryInputInfo}>
                  <View style={[
                    styles.categoryIcon,
                    { backgroundColor: category.color + '20' }
                  ]}>
                    <View style={[
                      styles.categoryColorDot,
                      { backgroundColor: category.color }
                    ]} />
                  </View>
                  <Text style={[styles.categoryInputName, { color: theme.text }]}>
                    {category.name}
                  </Text>
                </View>
                
                <View style={styles.amountInputContainer}>
                  <AmountInput
                    value={budgetAmounts[category._id!] || 0}
                    onChange={(value) => setBudgetAmounts(prev => ({
                      ...prev,
                      [category._id!]: value
                    }))}
                    placeholder="R$ 0,00"
                  />
                </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => setShowBudgetModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.createButton, { backgroundColor: theme.primary }]}
              onPress={handleCreateBudget}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Criar Orçamento</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="wallet-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Nenhum orçamento definido
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Crie um orçamento para controlar seus gastos mensais
      </Text>
      
      <View style={styles.emptyActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowBudgetModal(true)}
        >
          <Icon name="plus" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Criar Orçamento</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton, { borderColor: theme.primary }]}
          onPress={handleCreateFromPrevious}
        >
          <Icon name="content-copy" size={20} color={theme.primary} />
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
            Copiar do Mês Anterior
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MonthSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : currentBudget ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderBudgetSummary()}
          
          {/* Alerts */}
          {currentBudget.alerts.length > 0 && (
            <View style={[styles.alertsContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.alertsTitle, { color: theme.text }]}>
                Alertas
              </Text>
              {currentBudget.alerts.map(alert => (
                <View 
                  key={alert.id} 
                  style={[
                    styles.alertItem,
                    { 
                      backgroundColor: alert.type === 'danger' 
                        ? theme.error + '20' 
                        : theme.warning + '20' 
                    }
                  ]}
                >
                  <Icon 
                    name={alert.type === 'danger' ? 'alert-circle' : 'alert'} 
                    size={16} 
                    color={alert.type === 'danger' ? theme.error : theme.warning} 
                  />
                  <Text 
                    style={[
                      styles.alertText, 
                      { color: alert.type === 'danger' ? theme.error : theme.warning }
                    ]}
                  >
                    {alert.message}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Categories */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Orçamento por Categoria
          </Text>
          
          <FlatList
            data={currentBudget.categories}
            renderItem={renderCategoryBudget}
            keyExtractor={item => item.categoryId}
            scrollEnabled={false}
          />
          
          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowBudgetModal(true)}
            >
              <Icon name="pencil" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Editar Orçamento</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton, { backgroundColor: theme.error }]}
              onPress={handleDeleteBudget}
            >
              <Icon name="delete" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Excluir Orçamento</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        renderEmptyState()
      )}
      
      {renderBudgetModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  categoryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryAmounts: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryProgressContainer: {
    marginTop: 8,
  },
  alertsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyActions: {
    width: '100%',
  },
  actionsContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  budgetInputRow: {
    marginBottom: 16,
  },
  categoryInputInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInputName: {
    fontSize: 16,
    fontWeight: '500',
  },
  amountInputContainer: {
    marginLeft: 44,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#6200ee',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BudgetScreen;