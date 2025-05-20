// src/navigation/BottomTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';

// Importar navegadores de pilha
import TransactionsNavigator from './TransactionsNavigator';
import GoalsNavigator from './GoalsNavigator';
import CategoriesNavigator from './CategoriesNavigator';

// Importar telas
import Home from '../screens/Home';
import Reports from '../screens/Reports';
import Settings from '../screens/Settings';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          paddingBottom: 5,
          paddingTop: 5,
        },
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
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={Home}
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsNavigator}
        options={{
          title: 'Transações',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="swap-horizontal" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="GoalsTab"
        component={GoalsNavigator}
        options={{
          title: 'Metas',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="flag" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="ReportsTab"
        component={Reports}
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-bar" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="SettingsTab"
        component={Settings}
        options={{
          title: 'Configurações',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;