import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '../contexts/ThemeContext';

interface ThemedViewProps {
  style?: ViewStyle;
  children: React.ReactNode;
  level?: 'background' | 'surface' | 'card';
}

export const ThemedView: React.FC<ThemedViewProps> = ({ 
  children, 
  style, 
  level = 'surface' 
}) => {
  const { theme } = useTheme();
  
  const backgroundColor = {
    background: theme.colors.background,
    surface: theme.colors.surface,
    card: theme.colors.card,
  }[level];

  return (
    <View style={[{ backgroundColor }, style]}>
      {children}
    </View>
  );
};

interface ThemedTextProps {
  style?: TextStyle;
  children: React.ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  color?: 'primary' | 'secondary' | 'text' | 'textSecondary' | 'success' | 'error' | 'warning';
}

export const ThemedText: React.FC<ThemedTextProps> = ({ 
  children, 
  style, 
  variant = 'body',
  color = 'text'
}) => {
  const { theme } = useTheme();
  
  const typography = theme.typography[variant];
  const textColor = theme.colors[color];

  return (
    <Text style={[
      {
        fontSize: typography.fontSize,
        fontWeight: typography.fontWeight as TextStyle['fontWeight'],
        lineHeight: typography.lineHeight,
        color: textColor,
      },
      style
    ]}>
      {children}
    </Text>
  );
};

interface ThemedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ThemedCard: React.FC<ThemedCardProps> = ({ 
  children, 
  style, 
  padding = 'md' 
}) => {
  const { theme } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    padding: theme.spacing[padding],
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  };

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  disabled = false,
  style
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = {
      small: { paddingVertical: 8, paddingHorizontal: 16 },
      medium: { paddingVertical: 12, paddingHorizontal: 20 },
      large: { paddingVertical: 16, paddingHorizontal: 24 },
    }[size];

    const variantStyle = {
      primary: {
        backgroundColor: theme.colors.primary,
        borderWidth: 0,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        borderWidth: 0,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
    }[variant];

    return {
      ...baseStyle,
      ...variantStyle,
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextColor = () => {
    if (variant === 'primary' || variant === 'secondary') {
      return '#FFFFFF';
    }
    return theme.colors.primary;
  };

  const getTextStyle = (): TextStyle => ({
    color: getTextColor(),
    fontWeight: '600',
    fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
  });

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={18} 
          color={getTextColor()} 
          style={{ marginRight: title ? 8 : 0 }}
        />
      )}
      {title && (
        <Text style={getTextStyle()}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  trend
}) => {
  const { theme } = useTheme();

  const cardStyle: ViewStyle = {
    flex: 1,
    marginHorizontal: 4,
  };

  const iconContainerStyle: ViewStyle = {
    backgroundColor: `${color}20`,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <ThemedCard style={cardStyle}>
      <View style={styles.statCardHeader}>
        <View style={iconContainerStyle}>
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
  );
};

const styles = StyleSheet.create({
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});