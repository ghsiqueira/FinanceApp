// src/navigation/TransactionsNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';

// Importar telas
import Transactions from '../screens/Transactions';
import AddTransaction from '../screens/AddTransaction';
import TransactionDetails from '../screens/TransactionDetails';

const Stack = createStackNavigator();

const TransactionsNavigator = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomColor: theme.border,
          borderBottomWidth: 1,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: { backgroundColor: theme.background }
      }}
    >
      <Stack.Screen 
        name="Transactions" 
        component={Transactions} 
        options={{ title: 'Transações' }} 
      />
      <Stack.Screen 
        name="AddTransaction" 
        component={AddTransaction} 
        options={{ title: 'Nova Transação' }} 
      />
      <Stack.Screen 
        name="TransactionDetails" 
        component={TransactionDetails} 
        options={{ title: 'Detalhes da Transação' }} 
      />
    </Stack.Navigator>
  );
};

export default TransactionsNavigator;