import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import AddGoalModal from '../../components/AddGoalModal';
import { Goal } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedComponents';

interface RenderGoalProps {
  item: Goal;
}

const GoalsScreen = () => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await api.get('/goals');
      return response.data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      Alert.alert('Sucesso', 'Meta deletada');
    },
  });

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmar',
      'Deseja deletar esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Deletar', onPress: () => deleteMutation.mutate(id), style: 'destructive' }
      ]
    );
  };

  const renderGoal = ({ item }: RenderGoalProps) => {
    const progress = (item.currentAmount / item.targetAmount) * 100;
    const targetDate = new Date(item.targetDate);
    const currentDate = new Date();
    const daysLeft = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0;
    const isAlmostDue = daysLeft <= 30 && daysLeft > 0;

    return (
      <ThemedCard style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <ThemedText variant="subtitle" color="text" style={{ fontWeight: 'bold' }}>
              {item.title}
            </ThemedText>
            {isOverdue && (
              <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.error}20` }]}>
                <Ionicons name="alert-circle" size={12} color={theme.colors.error} />
                <ThemedText variant="caption" color="error" style={{ marginLeft: 4, fontSize: 10 }}>
                  Vencida
                </ThemedText>
              </View>
            )}
            {isAlmostDue && (
              <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.warning}20` }]}>
                <Ionicons name="time" size={12} color={theme.colors.warning} />
                <ThemedText variant="caption" color="warning" style={{ marginLeft: 4, fontSize: 10 }}>
                  {daysLeft} dias
                </ThemedText>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => handleDelete(item._id!)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <ThemedText variant="caption" color="textSecondary">
              Progresso
            </ThemedText>
            <ThemedText variant="caption" color={progress >= 100 ? 'success' : 'primary'} style={{ fontWeight: '600' }}>
              {progress.toFixed(1)}%
            </ThemedText>
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
        </View>

        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <ThemedText variant="caption" color="textSecondary">Atual</ThemedText>
            <ThemedText variant="body" color="text" style={{ fontWeight: '600' }}>
              R$ {item.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </ThemedText>
          </View>
          <View style={styles.amountRow}>
            <ThemedText variant="caption" color="textSecondary">Meta</ThemedText>
            <ThemedText variant="body" color="text" style={{ fontWeight: '600' }}>
              R$ {item.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </ThemedText>
          </View>
          <View style={styles.amountRow}>
            <ThemedText variant="caption" color="textSecondary">Restante</ThemedText>
            <ThemedText variant="body" color={item.targetAmount - item.currentAmount > 0 ? 'error' : 'success'} style={{ fontWeight: '600' }}>
              R$ {Math.max(0, item.targetAmount - item.currentAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.monthlyTargetContainer, { backgroundColor: `${theme.colors.primary}10` }]}>
          <View style={styles.monthlyTargetContent}>
            <Ionicons name="calendar" size={16} color={theme.colors.primary} />
            <ThemedText variant="caption" color="primary" style={{ marginLeft: 8, flex: 1 }}>
              💡 Guarde R$ {item.monthlyTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por mês para atingir sua meta
            </ThemedText>
          </View>
          {!isOverdue && (
            <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 4, textAlign: 'center' }}>
              {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Meta atingida! 🎉'}
            </ThemedText>
          )}
        </View>
      </ThemedCard>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: `${theme.colors.primary}10` }]}>
        <Ionicons name="flag-outline" size={48} color={theme.colors.primary} />
      </View>
      <ThemedText variant="subtitle" color="text" style={{ marginTop: 16, textAlign: 'center', fontWeight: '600' }}>
        Nenhuma meta criada ainda
      </ThemedText>
      <ThemedText variant="body" color="textSecondary" style={{ textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
        Defina metas financeiras para alcançar seus sonhos e objetivos!
      </ThemedText>
      <TouchableOpacity 
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <ThemedText variant="body" style={{ color: '#FFFFFF', marginLeft: 8, fontWeight: '600' }}>
          Criar minha primeira meta
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView level="background" style={styles.container}>
      <ThemedView level="surface" style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText variant="title" color="text" style={{ fontWeight: 'bold' }}>
            🎯 Metas
          </ThemedText>
          {goals.length > 0 && (
            <ThemedText variant="caption" color="textSecondary">
              {goals.length} {goals.length === 1 ? 'meta ativa' : 'metas ativas'}
            </ThemedText>
          )}
        </View>
        {goals.length > 0 && (
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </ThemedView>

      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={(item) => item._id!}
        contentContainerStyle={[
          styles.list,
          goals.length === 0 && styles.emptyList
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      <AddGoalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  list: {
    padding: 20,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  goalCard: {
    padding: 20,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  deleteButton: {
    padding: 4,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  amountSection: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthlyTargetContainer: {
    borderRadius: 12,
    padding: 16,
  },
  monthlyTargetContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 24,
  },
});

export default GoalsScreen;