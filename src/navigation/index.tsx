// src/navigation/index.tsx (corrigido para versão mais recente do React Navigation)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import BottomTabNavigator from './BottomTabNavigator';

// Provedor de contextos para toda a aplicação
import { ThemeProvider } from '../context/ThemeContext';
import { CategoryProvider } from '../context/CategoryContext';
import { TransactionProvider } from '../context/TransactionContext';
import { GoalProvider } from '../context/GoalContext';

// Navegação principal sem os provedores de contexto
const Navigation = () => {
  const { isDarkMode, theme } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: isDarkMode,
        colors: {
          primary: theme.primary,
          background: theme.background,
          card: theme.card,
          text: theme.text,
          border: theme.border,
          notification: theme.error,
        },
        // Adicionando a propriedade fonts com apenas as propriedades suportadas
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          }
        }
      }}
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <BottomTabNavigator />
    </NavigationContainer>
  );
};

// Aplicativo com todos os provedores de contexto
const AppWithProviders = () => {
  return (
    <ThemeProvider>
      <CategoryProvider>
        <TransactionProvider>
          <GoalProvider>
            <Navigation />
          </GoalProvider>
        </TransactionProvider>
      </CategoryProvider>
    </ThemeProvider>
  );
};

export default AppWithProviders;