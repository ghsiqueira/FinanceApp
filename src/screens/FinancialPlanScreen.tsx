// src/screens/FinancialPlanScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useFinancialPlan } from '../context/FinancialPlanContext';
import { useGoals } from '../context/GoalContext';
import { formatCurrency } from '../utils/formatters';
import { Goal } from '../types';

const FinancialPlanScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { financialPlan, updateFinancialPlan, recalculateGoalContributions, loading: planLoading } = useFinancialPlan();
  const { goals, loading: goalsLoading } = useGoals();
  
  // Estado local para os inputs
  const [monthlyIncome, setMonthlyIncome] = useState<string>(financialPlan.monthlyIncome.toString());
  const [savingsPercentage, setSavingsPercentage] = useState<string>(financialPlan.savingsPercentage.toString());
  const [autoDistribute, setAutoDistribute] = useState<boolean>(financialPlan.autoDistribute);
  
  // Atualizar estado local quando o plano financeiro for carregado
  useEffect(() => {
    if (!planLoading) {
      setMonthlyIncome(financialPlan.monthlyIncome.toString());
      setSavingsPercentage(financialPlan.savingsPercentage.toString());
      setAutoDistribute(financialPlan.autoDistribute);
    }
  }, [financialPlan, planLoading]);
  
  // Filtra metas ativas (não concluídas)
  const activeGoals = goals.filter(goal => !goal.isCompleted);
  
  // Calcular totais
  const totalMonthlyContribution = activeGoals.reduce(
    (sum, goal) => sum + goal.monthlyContribution, 
    0
  );
  
  const totalSavingsAmount = financialPlan.monthlyIncome * (financialPlan.savingsPercentage / 100);
  
  // Salvar alterações
  const handleSave = async () => {
    try {
      // Converter valores para números
      const numericIncome = parseFloat(monthlyIncome) || 0;
      const numericPercentage = Math.min(100, Math.max(0, parseFloat(savingsPercentage) || 0));
      
      await updateFinancialPlan({
        monthlyIncome: numericIncome,
        savingsPercentage: numericPercentage,
        autoDistribute
      });
      
      Alert.alert(
        'Sucesso',
        'Plano financeiro atualizado com sucesso!'
      );
      
      // Recalcular contribuições após atualizar o plano
      await recalculateGoalContributions();
    } catch (error) {
      console.error('Erro ao salvar plano financeiro:', error);
      Alert.alert(
        'Erro',
        'Não foi possível atualizar o plano financeiro. Tente novamente.'
      );
    }
  };
  
  // Recalcular contribuições manualmente
  const handleRecalculate = async () => {
    try {
      await recalculateGoalContributions();
      
      Alert.alert(
        'Sucesso',
        'Contribuições para metas recalculadas com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao recalcular contribuições:', error);
      Alert.alert(
        'Erro',
        'Não foi possível recalcular as contribuições. Tente novamente.'
      );
    }
  };
  
  // Renderização condicional para estado de carregamento
  if (planLoading || goalsLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Planejamento Financeiro
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Configure sua renda e distribuição para suas metas
        </Text>
      </View>
      
      {/* Configurações do plano */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Renda e Economia
        </Text>
        
        {/* Renda Mensal */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>
            Renda Mensal
          </Text>
          <View style={[
            styles.textInputContainer, 
            { borderColor: theme.border, backgroundColor: theme.background }
          ]}>
            <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>R$</Text>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              keyboardType="numeric"
              placeholder="0,00"
              placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>
        
        {/* Porcentagem para Metas */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>
            Porcentagem para Metas e Economias
          </Text>
          <View style={[
            styles.textInputContainer, 
            { borderColor: theme.border, backgroundColor: theme.background }
          ]}>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              value={savingsPercentage}
              onChangeText={setSavingsPercentage}
              keyboardType="numeric"
              placeholder="20"
              placeholderTextColor={theme.textSecondary}
            />
            <Text style={[styles.percentageSymbol, { color: theme.textSecondary }]}>%</Text>
          </View>
        </View>
        
        {/* Distribuição Automática */}
        <View style={styles.switchContainer}>
          <View>
            <Text style={[styles.switchLabel, { color: theme.text }]}>
              Distribuição Automática
            </Text>
            <Text style={[styles.switchDescription, { color: theme.textSecondary }]}>
              Distribui automaticamente valores entre metas por prioridade
            </Text>
          </View>
          <Switch
            value={autoDistribute}
            onValueChange={setAutoDistribute}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={autoDistribute ? theme.primary : '#f4f3f4'}
          />
        </View>
      </View>
      
      {/* Resumo do Planejamento */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Resumo do Planejamento
        </Text>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Total para metas mensalmente:
          </Text>
          <Text style={[styles.summaryValue, { color: theme.success }]}>
            {formatCurrency(totalSavingsAmount)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Contribuições alocadas:
          </Text>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>
            {formatCurrency(totalMonthlyContribution)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Diferença:
          </Text>
          <Text style={[
            styles.summaryValue, 
            { color: totalSavingsAmount >= totalMonthlyContribution ? theme.success : theme.error }
          ]}>
            {formatCurrency(totalSavingsAmount - totalMonthlyContribution)}
          </Text>
        </View>
        
        {totalSavingsAmount < totalMonthlyContribution && (
          <View style={styles.warningContainer}>
            <Icon name="alert" size={20} color={theme.warning} />
            <Text style={[styles.warningText, { color: theme.warning }]}>
              As contribuições para metas excedem o valor disponível para economias.
            </Text>
          </View>
        )}
      </View>
      
      {/* Lista de Metas com Contribuições */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Contribuições para Metas
        </Text>
        
        {activeGoals.length === 0 ? (
          <Text style={[styles.emptyGoalsText, { color: theme.textSecondary }]}>
            Você não tem metas ativas.
          </Text>
        ) : (
          activeGoals.map((goal) => (
            <View key={goal._id} style={styles.goalItem}>
              <View style={styles.goalInfo}>
                <View style={[
                  styles.goalPriorityBadge, 
                  { backgroundColor: getPriorityColor(goal.priority, theme) }
                ]}>
                  <Text style={styles.goalPriorityText}>
                    P{goal.priority}
                  </Text>
                </View>
                <Text style={[styles.goalTitle, { color: theme.text }]}>
                  {goal.title}
                </Text>
              </View>
              <Text style={[styles.goalContribution, { color: theme.primary }]}>
                {formatCurrency(goal.monthlyContribution)}
              </Text>
            </View>
          ))
        )}
        
        <TouchableOpacity
          style={[styles.recalculateButton, { backgroundColor: theme.primary + '20' }]}
          onPress={handleRecalculate}
        >
          <Icon name="refresh" size={20} color={theme.primary} />
          <Text style={[styles.recalculateButtonText, { color: theme.primary }]}>
            Recalcular Contribuições
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Botão de Salvar */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }]}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>
          Salvar Alterações
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Função de utilidade para obter cor com base na prioridade
const getPriorityColor = (priority: number, theme: any) => {
  switch (priority) {
    case 1: return '#dc3545'; // Muito alta - vermelho
    case 2: return '#fd7e14'; // Alta - laranja
    case 3: return '#ffc107'; // Média - amarelo
    case 4: return '#28a745'; // Baixa - verde
    case 5: return '#6c757d'; // Muito baixa - cinza
    default: return theme.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  currencySymbol: {
    fontSize: 16,
    marginRight: 8,
  },
  percentageSymbol: {
    fontSize: 16,
    marginLeft: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    width: '80%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    marginLeft: 8,
    flex: 1,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalPriorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalPriorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalTitle: {
    fontSize: 16,
    flex: 1,
  },
  goalContribution: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyGoalsText: {
    textAlign: 'center',
    padding: 16,
  },
  recalculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  recalculateButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FinancialPlanScreen;