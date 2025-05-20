// src/screens/TransactionDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionContext';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';

interface RouteParams {
  transactionId: string;
}

const TransactionDetails = () => {
  const route = useRoute();
  const { transactionId } = route.params as RouteParams;
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { transactions, deleteTransaction, loading } = useTransactions();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Find transaction in the context
  useEffect(() => {
    const foundTransaction = transactions.find(t => t._id === transactionId);
    
    if (foundTransaction) {
      setTransaction(foundTransaction);
    }
  }, [transactionId, transactions]);
  
  // Handle edit transaction
  const handleEdit = () => {
    if (transaction) {
      navigation.navigate('AddTransaction', { transaction });
    }
  };
  
  // Handle delete transaction
  const handleDelete = () => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            if (!transaction?._id) return;
            
            setDeleting(true);
            try {
              await deleteTransaction(transaction._id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Erro', 'Não foi possível excluir a transação.');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  // Loading state
  if (loading || !transaction) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  // Format date
  const formattedDate = format(
    new Date(transaction.date),
    'dd MMMM yyyy',
    { locale: ptBR }
  );
  
  // Get category information
  const category = typeof transaction.category === 'object' 
    ? transaction.category 
    : null;
    
  const categoryName = category ? category.name : 'Categoria';
  const categoryColor = category ? category.color : '#999';
  const categoryIcon = category ? category.icon : 'help-circle';
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: transaction.type === 'income' 
            ? 'rgba(40, 167, 69, 0.1)' 
            : 'rgba(220, 53, 69, 0.1)' 
        }
      ]}>
        <View style={styles.typeContainer}>
          <Icon 
            name={transaction.type === 'income' ? 'arrow-down' : 'arrow-up'} 
            size={24} 
            color={transaction.type === 'income' ? '#28a745' : '#dc3545'} 
          />
          <Text style={[
            styles.typeText,
            { 
              color: transaction.type === 'income' 
                ? '#28a745' 
                : '#dc3545' 
            }
          ]}>
            {transaction.type === 'income' ? 'Receita' : 'Despesa'}
          </Text>
        </View>
        
        <Text style={[
          styles.amount,
          { 
            color: transaction.type === 'income' 
              ? '#28a745' 
              : '#dc3545' 
          }
        ]}>
          {formatCurrency(transaction.amount)}
        </Text>
        
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {formattedDate}
        </Text>
      </View>
      
      {/* Category */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
            Categoria
          </Text>
          <View style={styles.categoryContainer}>
            <View style={[
              styles.categoryIcon,
              { backgroundColor: categoryColor + '20' }
            ]}>
              <Icon name={categoryIcon} size={20} color={categoryColor} />
            </View>
            <Text style={[styles.categoryName, { color: theme.text }]}>
              {categoryName}
            </Text>
          </View>
        </View>
        
        {/* Description */}
        {transaction.description ? (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Descrição
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {transaction.description}
            </Text>
          </View>
        ) : null}
        
        {/* Creation Date */}
        {transaction.createdAt ? (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Criado em
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {format(
                new Date(transaction.createdAt),
                'dd/MM/yyyy HH:mm',
                { locale: ptBR }
              )}
            </Text>
          </View>
        ) : null}
        
        {/* Last Update */}
        {transaction.updatedAt && transaction.updatedAt !== transaction.createdAt ? (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
              Última atualização
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {format(
                new Date(transaction.updatedAt),
                'dd/MM/yyyy HH:mm',
                { locale: ptBR }
              )}
            </Text>
          </View>
        ) : null}
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.primary }]}
          onPress={handleEdit}
          disabled={deleting}
        >
          <Icon name="pencil" size={20} color="#fff" />
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.error }]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Icon name="delete" size={20} color="#fff" />
              <Text style={styles.buttonText}>Excluir</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TransactionDetails;