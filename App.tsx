// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { CategoryProvider } from './src/context/CategoryContext';
import { TransactionProvider } from './src/context/TransactionContext';
import { GoalProvider } from './src/context/GoalContext';
import AppNavigation from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <CategoryProvider>
          <TransactionProvider>
            <GoalProvider>
              <StatusBar style="auto" />
              <AppNavigation />
            </GoalProvider>
          </TransactionProvider>
        </CategoryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}