// src/screens/AddTransaction.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../context/TransactionContext';
import { Transaction } from '../types';
import TransactionForm from '../components/TransactionForm';

const AddTransaction = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { addTransaction, loading } = useTransactions();
  const [submitting, setSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (transaction: Transaction) => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      await addTransaction(transaction);
      
      // Show success message
      Alert.alert(
        'Sucesso',
        'Transação adicionada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding transaction:', error);
      
      // Show error message
      Alert.alert(
        'Erro',
        'Não foi possível adicionar a transação. Tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TransactionForm onSubmit={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AddTransaction;