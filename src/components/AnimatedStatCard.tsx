import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withDelay
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ThemedText, ThemedCard } from './ThemedComponents';

interface AnimatedStatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  delay?: number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const AnimatedStatCard: React.FC<AnimatedStatCardProps> = ({
  title,
  value,
  icon,
  color,
  delay = 0,
  trend
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 100 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 100 }));
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }));

  return (
    <Animated.View style={[{ flex: 1, marginHorizontal: 4 }, animatedStyle]}>
      <ThemedCard>
        <View style={styles.statCardHeader}>
          <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          {trend && (
            <View style={styles.trendContainer}>
              <Ionicons 
                name={trend.isPositive ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={trend.isPositive ? theme.colors.success : theme.colors.error} 
              />
              <ThemedText 
                variant="caption" 
                color={trend.isPositive ? 'success' : 'error'}
                style={{ marginLeft: 2 }}
              >
                {Math.abs(trend.value)}%
              </ThemedText>
            </View>
          )}
        </View>
        
        <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: 4 }}>
          {title}
        </ThemedText>
        
        <ThemedText variant="subtitle" color="text" style={{ fontWeight: 'bold' }}>
          {value}
        </ThemedText>
      </ThemedCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AnimatedStatCard;