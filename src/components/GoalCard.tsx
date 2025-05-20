// src/components/GoalCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { Goal } from '../types';
import { formatCurrency } from '../utils/formatters';

interface GoalCardProps {
  goal: Goal;
  onPress: (goal: Goal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress }) => {
  const { theme } = useTheme();

  // Calcular progresso da meta (0 a 1)
  const progress = goal.targetAmount > 0
    ? Math.min(goal.currentAmount / goal.targetAmount, 1)
    : 0;
  
  // Porcentagem formatada
  const percentage = Math.round(progress * 100);

  // Calcular categoria, se existir
  const categoryName = typeof goal.category === 'object' && goal.category
    ? goal.category.name
    : '';
    
  // Formatar data limite, se existir
  const formattedDeadline = goal.deadline
    ? new Date(goal.deadline).toLocaleDateString('pt-BR')
    : '';

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.card }]}
      onPress={() => onPress(goal)}
      activeOpacity={0.7}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          {goal.isCompleted && (
            <Icon name="check-circle" size={20} color={theme.success} style={styles.completedIcon} />
          )}
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {goal.title}
          </Text>
        </View>
        
        <View style={[styles.badge, { backgroundColor: goal.color + '20' }]}>
          <Text style={[styles.badgeText, { color: goal.color }]}>
            {goal.isCompleted ? 'Concluída' : `${percentage}%`}
          </Text>
        </View>
      </View>
      
      <View style={styles.amountsContainer}>
        <Text style={[styles.currentAmount, { color: theme.primary }]}>
          {formatCurrency(goal.currentAmount)}
        </Text>
        <Text style={[styles.separator, { color: theme.textSecondary }]}>/</Text>
        <Text style={[styles.targetAmount, { color: theme.textSecondary }]}>
          {formatCurrency(goal.targetAmount)}
        </Text>
      </View>
      
      <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressBar,
            { 
              backgroundColor: goal.color,
              width: `${percentage}%` 
            }
          ]}
        />
      </View>
      
      <View style={styles.footerRow}>
        {categoryName ? (
          <View style={styles.categoryContainer}>
            <Icon name="tag" size={14} color={theme.textSecondary} />
            <Text style={[styles.categoryName, { color: theme.textSecondary }]}>
              {categoryName}
            </Text>
          </View>
        ) : <View />}
        
        {formattedDeadline ? (
          <View style={styles.deadlineContainer}>
            <Icon name="calendar" size={14} color={theme.textSecondary} />
            <Text style={[styles.deadline, { color: theme.textSecondary }]}>
              {formattedDeadline}
            </Text>
          </View>
        ) : <View />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  completedIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  amountsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  currentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  separator: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  targetAmount: {
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    marginLeft: 4,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadline: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default GoalCard;