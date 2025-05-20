// src/navigation/GoalsNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';

// Importar telas
import Goals from '../screens/Goals';
import AddGoal from '../screens/AddGoal';
import GoalDetails from '../screens/GoalDetails';

const Stack = createStackNavigator();

const GoalsNavigator = () => {
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
        name="Goals" 
        component={Goals} 
        options={{ title: 'Metas' }} 
      />
      <Stack.Screen 
        name="AddGoal" 
        component={AddGoal} 
        options={{ title: 'Nova Meta' }} 
      />
      <Stack.Screen 
        name="GoalDetails" 
        component={GoalDetails} 
        options={{ title: 'Detalhes da Meta' }} 
      />
    </Stack.Navigator>
  );
};

export default GoalsNavigator;