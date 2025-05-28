import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS,
  useAnimatedGestureHandler,
  withSpring,
  withSequence  // Adicionar este import
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';
import { ThemedText, ThemedCard } from './ThemedComponents';
import { Transaction } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface SwipeableTransactionCardProps {
  item: Transaction;
  onDelete: (id: string) => void;
  onEdit?: (item: Transaction) => void;
}

const SwipeableTransactionCard: React.FC<SwipeableTransactionCardProps> = ({ 
  item, 
  onDelete, 
  onEdit 
}) => {
  const { theme } = useTheme();
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      scale.value = withSpring(0.95);
    },
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: (event) => {
      scale.value = withSpring(1);
      
      if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe para esquerda - deletar
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        runOnJS(() => {
          setTimeout(() => onDelete(item._id!), 300);
        })();
      } else if (event.translationX > SWIPE_THRESHOLD && onEdit) {
        // Swipe para direita - editar
        translateX.value = withTiming(0, { duration: 300 });
        runOnJS(() => onEdit(item))();
      } else {
        // Voltar ao normal
        translateX.value = withTiming(0, { duration: 300 });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  const backgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = translateX.value < 0 ? theme.colors.error : theme.colors.primary;
    const opacityValue = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    
    return {
      backgroundColor: backgroundColor + Math.round(opacityValue * 255).toString(16).padStart(2, '0'),
    };
  });

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.background, backgroundStyle]}>
        <View style={styles.actionContainer}>
          {onEdit && (
            <View style={styles.leftAction}>
              <Ionicons name="pencil" size={24} color="#FFFFFF" />
              <ThemedText variant="caption" style={{ color: '#FFFFFF', marginTop: 4 }}>
                Editar
              </ThemedText>
            </View>
          )}
          <View style={styles.rightAction}>
            <Ionicons name="trash" size={24} color="#FFFFFF" />
            <ThemedText variant="caption" style={{ color: '#FFFFFF', marginTop: 4 }}>
              Deletar
            </ThemedText>
          </View>
        </View>
      </Animated.View>

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
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
                <ThemedText 
                  variant="body" 
                  color={item.type === 'income' ? 'success' : 'error'}
                  style={{ fontWeight: 'bold' }}
                >
                  {item.type === 'income' ? '+' : '-'}R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </ThemedText>
              </View>
            </ThemedCard>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  leftAction: {
    alignItems: 'center',
  },
  rightAction: {
    alignItems: 'center',
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
});

export default SwipeableTransactionCard;