import { View, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import AddGoalModal from '../../components/AddGoalModal';
import EditGoalModal from '../../components/EditGoalModal';
import GoalViewModal from '../../components/GoalViewModal';
import { Goal } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemedView, ThemedText, ThemedCard } from '../../components/ThemedComponents';
import { useState } from 'react';

interface RenderGoalProps {
  item: Goal;
}

const GoalsScreen = () => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
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
      Alert.alert('Sucesso', 'Meta deletada com sucesso!');
    },
    onError: () => {
      Alert.alert('Erro', 'Não foi possível deletar a meta.');
    }
  });

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a meta "${title}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Deletar', onPress: () => deleteMutation.mutate(id), style: 'destructive' }
      ]
    );
  };

  const handleView = (goal: Goal) => {
    setSelectedGoal(goal);
    setViewModalVisible(true);
  };

  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setViewModalVisible(false);
    setEditModalVisible(true);
  };

  const handleEditFromView = () => {
    setViewModalVisible(false);
    setEditModalVisible(true);
  };

  const renderGoal = ({ item }: RenderGoalProps) => {
    const progress = (item.currentAmount / item.targetAmount) * 100;
    const targetDate = new Date(item.targetDate);
    const currentDate = new Date();
    const daysLeft = Math.ceil((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0;
    const isAlmostDue = daysLeft <= 30 && daysLeft > 0;
    const isCompleted = progress >= 100;

    return (
      <ThemedCard style={styles.goalCard}>
        <TouchableOpacity 
          onPress={() => handleView(item)}
          activeOpacity={0.8}
          style={styles.goalTouchable}
        >
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <ThemedText variant="subtitle" color="text" style={{ fontWeight: 'bold' }}>
                {item.title}
              </ThemedText>
              {isCompleted && (
                <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.success}20` }]}>
                  <Ionicons name="checkmark-circle" size={12} color={theme.colors.success} />
                  <ThemedText variant="caption" color="success" style={{ marginLeft: 4, fontSize: 10 }}>
                    CONCLUÍDA
                  </ThemedText>
                </View>
              )}
              {isOverdue && !isCompleted && (
                <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.error}20` }]}>
                  <Ionicons name="alert-circle" size={12} color={theme.colors.error} />
                  <ThemedText variant="caption" color="error" style={{ marginLeft: 4, fontSize: 10 }}>
                    VENCIDA
                  </ThemedText>
                </View>
              )}
              {isAlmostDue && !isCompleted && (
                <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.warning}20` }]}>
                  <Ionicons name="time" size={12} color={theme.colors.warning} />
                  <ThemedText variant="caption" color="warning" style={{ marginLeft: 4, fontSize: 10 }}>
                    {daysLeft} DIAS
                  </ThemedText>
                </View>
              )}
            </View>
            
            <View style={styles.goalActions}>
              <TouchableOpacity 
                onPress={() => handleEdit(item)} 
                style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}15` }]}
              >
                <Ionicons name="pencil" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDelete(item._id!, item.title)} 
                style={[styles.actionButton, { backgroundColor: `${theme.colors.error}15` }]}
              >
                <Ionicons name="trash" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <ThemedText variant="caption" color="textSecondary">
                Progresso
              </ThemedText>
              <ThemedText variant="caption" color={isCompleted ? 'success' : 'primary'} style={{ fontWeight: '600' }}>
                {progress.toFixed(1)}%
              </ThemedText>
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
                {daysLeft > 0 ? `${daysLeft} dias restantes` : isCompleted ? 'Meta atingida! 🎉' : 'Prazo vencido'}
              </ThemedText>
            )}
          </View>

          {/* Indicador de que é clicável */}
          <View style={styles.clickIndicator}>
            <Ionicons name="eye" size={16} color={theme.colors.textSecondary} />
            <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
              Toque para ver detalhes
            </ThemedText>
          </View>
        </TouchableOpacity>
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

  const renderHeader = () => (
    <ThemedView level="surface" style={styles.header}>
      <View style={styles.headerContent}>
        <ThemedText variant="title" color="text" style={{ fontWeight: 'bold' }}>
          🎯 Metas
        </ThemedText>
        {goals.length > 0 && (
          <View style={styles.headerStats}>
            <ThemedText variant="caption" color="textSecondary">
              {goals.length} {goals.length === 1 ? 'meta ativa' : 'metas ativas'}
            </ThemedText>
            <View style={styles.headerStatsDetail}>
              <ThemedText variant="caption" color="success">
                {goals.filter(g => (g.currentAmount / g.targetAmount) >= 1).length} concluídas
              </ThemedText>
              <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
              <ThemedText variant="caption" color="warning">
                {goals.filter(g => {
                  const daysLeft = Math.ceil((new Date(g.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return daysLeft <= 30 && daysLeft > 0 && (g.currentAmount / g.targetAmount) < 1;
                }).length} próximas do vencimento
              </ThemedText>
            </View>
          </View>
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
  );

  return (
    <ThemedView level="background" style={styles.container}>
      {renderHeader()}

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

      <GoalViewModal
        visible={viewModalVisible}
        onClose={() => {
          setViewModalVisible(false);
          setSelectedGoal(null);
        }}
        onEdit={handleEditFromView}
        goal={selectedGoal}
      />

      <EditGoalModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
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
  headerStats: {
    marginTop: 4,
  },
  headerStatsDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
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
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  goalTouchable: {
    padding: 20,
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
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
  },
  monthlyTargetContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clickIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: 4,
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