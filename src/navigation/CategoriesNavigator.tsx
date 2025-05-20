// src/navigation/CategoriesNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';

// Importar telas
import Categories from '../screens/Categories';
import AddCategory from '../screens/AddCategory';

const Stack = createStackNavigator();

const CategoriesNavigator = () => {
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
        name="Categories" 
        component={Categories} 
        options={{ title: 'Categorias' }} 
      />
      <Stack.Screen 
        name="AddCategory" 
        component={AddCategory} 
        options={{ title: 'Nova Categoria' }} 
      />
    </Stack.Navigator>
  );
};

export default CategoriesNavigator;