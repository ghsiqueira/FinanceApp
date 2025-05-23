// src/navigation/BottomTabNavigator.tsx - Versão atualizada com novas telas
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
import BudgetScreen from '../screens/BudgetScreen';

// Definir tipos para as abas
export type BottomTabParamList = {
  HomeTab: undefined;
  TransactionsTab: undefined;
  BudgetTab: undefined;
  GoalsTab: undefined;
  ReportsTab: undefined;
  SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'TransactionsTab':
              iconName = focused ? 'swap-horizontal' : 'swap-horizontal';
              break;
            case 'BudgetTab':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'GoalsTab':
              iconName = focused ? 'flag' : 'flag-outline';
              break;
            case 'ReportsTab':
              iconName = focused ? 'chart-bar' : 'chart-bar';
              break;
            case 'SettingsTab':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
            default:
              iconName = 'help-circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
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
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={Home}
        options={{
          title: 'Início',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsNavigator}
        options={{
          title: 'Transações',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="BudgetTab"
        component={BudgetScreen}
        options={{
          title: 'Orçamento',
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
            fontSize: 18,
          },
        }}
      />

      <Tab.Screen
        name="GoalsTab"
        component={GoalsNavigator}
        options={{
          title: 'Metas',
          headerShown: false,
        }}
      />

      <Tab.Screen
        name="ReportsTab"
        component={Reports}
        options={{
          title: 'Relatórios',
        }}
      />

      <Tab.Screen
        name="SettingsTab"
        component={Settings}
        options={{
          title: 'Configurações',
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;