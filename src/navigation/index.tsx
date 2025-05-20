// src/navigation/index.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import BottomTabNavigator from './BottomTabNavigator';
import LoadingScreen from '../screens/LoadingScreen';

const AppNavigation = () => {
  const { isDarkMode, theme } = useTheme();
  const { signed, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

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
      {signed ? <BottomTabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigation;