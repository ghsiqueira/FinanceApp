import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { ThemedText, ThemedCard } from './ThemedComponents';
import { Transaction } from '../types';

interface TransactionCardProps {
  item: Transaction;
  onDelete: (id: string) => void;
  onEdit: (item: Transaction) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ 
  item, 
  onDelete, 
  onEdit 
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const handleEdit = () => {
    handlePress();
    onEdit(item);
  };

  const handleDelete = () => {
    handlePress();
    onDelete(item._id!);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <ThemedCard style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.transactionLeft}>
            <View style={[
              styles.transactionIcon,
              { backgroundColor: item.type === 'income' ? `${theme.colors.success}20` : `${theme.colors.error}20` }
            ]}>
              <Ionicons 
                name={item.type === 'income' ? 'trending-up' : 'trending-down'} 
                size={20} 
                color={item.type === 'income' ? theme.colors.success : theme.colors.error} 
              />
            </View>
            <View style={styles.transactionInfo}>
              <View style={styles.titleRow}>
                <ThemedText variant="body" color="text" style={{ fontWeight: '600', flex: 1 }}>
                  {item.description}
                </ThemedText>
                {item.isRecurring && (
                  <View style={[styles.recurringBadge, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Ionicons name="refresh" size={10} color={theme.colors.primary} />
                    <ThemedText 
                      variant="caption" 
                      color="primary" 
                      style={{ marginLeft: 2, fontSize: 9, fontWeight: '600' }}
                    >
                      RECORRENTE
                    </ThemedText>
                  </View>
                )}
              </View>
              <View style={styles.transactionMeta}>
                <ThemedText variant="caption" color="textSecondary">
                  {item.category}
                </ThemedText>
                <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
                <ThemedText variant="caption" color="textSecondary">
                  {new Date(item.date).toLocaleDateString('pt-BR')}
                </ThemedText>
                {item.isRecurring && (
                  <>
                    <View style={[styles.dot, { backgroundColor: theme.colors.textSecondary }]} />
                    <ThemedText variant="caption" color="primary">
                      {item.recurringFrequency === 'monthly' ? 'Mensal' :
                       item.recurringFrequency === 'weekly' ? 'Semanal' :
                       item.recurringFrequency === 'daily' ? 'Diário' : 'Anual'}
                    </ThemedText>
                  </>
                )}
              </View>
            </View>
          </View>

          <View style={styles.transactionRight}>
            <ThemedText 
              variant="body" 
              color={item.type === 'income' ? 'success' : 'error'}
              style={{ fontWeight: 'bold', marginBottom: 8 }}
            >
              {item.type === 'income' ? '+' : '-'}R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </ThemedText>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                onPress={handleEdit}
                style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}15` }]}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleDelete}
                style={[styles.actionButton, { backgroundColor: `${theme.colors.error}15` }]}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ThemedCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  card: {
    margin: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 6,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // Removidas todas as propriedades de sombra:
    // shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation
  },
});

export default TransactionCard;