// src/components/TransactionCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TransactionCardProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onPress }) => {
  // Verificar se category é um objeto ou string
  const categoryName = typeof transaction.category === 'object' 
    ? transaction.category.name 
    : 'Categoria';
    
  const categoryColor = typeof transaction.category === 'object' 
    ? transaction.category.color 
    : '#0000FF';
    
  const categoryIcon = typeof transaction.category === 'object' 
    ? transaction.category.icon 
    : 'cash';
    
  // Formatar data
  const formattedDate = typeof transaction.date === 'string' 
    ? format(new Date(transaction.date), 'dd MMM', { locale: ptBR }) 
    : format(transaction.date, 'dd MMM', { locale: ptBR });
    
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View 
          style={[
            styles.iconBackground, 
            { backgroundColor: categoryColor + '20' } // Adiciona transparência à cor
          ]}
        >
          <Icon name={categoryIcon} size={24} color={categoryColor} />
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.description} numberOfLines={1}>
          {transaction.description || categoryName}
        </Text>
        <Text style={styles.category}>{categoryName}</Text>
      </View>
      
      <View style={styles.valueContainer}>
        <Text 
          style={[
            styles.value, 
            { color: transaction.type === 'income' ? '#28a745' : '#dc3545' }
          ]}
        >
          {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  valueContainer: {
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});

export default TransactionCard;