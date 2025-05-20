// src/components/HomeHeader.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { MonthlySummary } from '../types';
import { formatCurrency } from '../utils/formatters';

interface HomeHeaderProps {
  summary: MonthlySummary | null;
  loading: boolean;
  monthName: string;
  onToggleVisibility: () => void;
  hideValues: boolean;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  summary,
  loading,
  monthName,
  onToggleVisibility,
  hideValues
}) => {
  const { theme, isDarkMode } = useTheme();
  
  // Capitalize first letter of month name
  const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Format values or show placeholder
  const formatValue = (value: number) => {
    return hideValues ? 'R$ ••••••' : formatCurrency(value);
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: theme.primary }
    ]}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>Olá!</Text>
          <Text style={styles.monthText}>{formattedMonth}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.visibilityButton}
          onPress={onToggleVisibility}
        >
          <Icon 
            name={hideValues ? 'eye-off' : 'eye'} 
            size={24} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>Saldo atual</Text>
        
        {loading ? (
          <Text style={styles.balanceValue}>Carregando...</Text>
        ) : (
          <Text style={[
            styles.balanceValue,
            summary && summary.balance < 0 ? { color: '#ff6b6b' } : null
          ]}>
            {summary ? formatValue(summary.balance) : formatValue(0)}
          </Text>
        )}
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={[
          styles.summaryCard, 
          { backgroundColor: isDarkMode ? 'rgba(40, 167, 69, 0.2)' : 'rgba(40, 167, 69, 0.1)' }
        ]}>
          <Icon name="arrow-down" size={24} color="#28a745" />
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: '#28a745' }]}>
            {summary ? formatValue(summary.income) : formatValue(0)}
          </Text>
        </View>
        
        <View style={[
          styles.summaryCard, 
          { backgroundColor: isDarkMode ? 'rgba(220, 53, 69, 0.2)' : 'rgba(220, 53, 69, 0.1)' }
        ]}>
          <Icon name="arrow-up" size={24} color="#dc3545" />
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: '#dc3545' }]}>
            {summary ? formatValue(summary.expense) : formatValue(0)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60, // To account for status bar
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  monthText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
  },
  visibilityButton: {
    padding: 8,
  },
  balanceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  summaryCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default HomeHeader;