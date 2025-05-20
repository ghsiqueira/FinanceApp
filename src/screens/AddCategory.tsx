// src/screens/AddCategory.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../context/CategoryContext';
import { Category } from '../types';
import CategoryForm from '../components/CategoryForm';

interface RouteParams {
  category?: Category;
}

const AddCategory = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = (route.params as RouteParams) || {};
  const { theme } = useTheme();
  const { addCategory, updateCategory, loading } = useCategories();
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!category;

  // Handle form submission
  const handleSubmit = async (categoryData: Category) => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      if (isEditing && category?._id) {
        await updateCategory(category._id, categoryData);
        Alert.alert(
          'Sucesso',
          'Categoria atualizada com sucesso!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        await addCategory(categoryData);
        Alert.alert(
          'Sucesso',
          'Categoria criada com sucesso!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert(
        'Erro',
        `Não foi possível ${isEditing ? 'atualizar' : 'criar'} a categoria. Tente novamente.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CategoryForm 
        initialValues={category}
        onSubmit={handleSubmit}
        isEditing={isEditing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AddCategory;