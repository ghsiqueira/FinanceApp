// src/screens/AddGoal.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useGoals } from '../context/GoalContext';
import { Goal } from '../types';
import GoalForm from '../components/GoalForm';

const AddGoal = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { addGoal, loading } = useGoals();
  const [submitting, setSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (goal: Goal) => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      await addGoal(goal);
      
      // Show success message
      Alert.alert(
        'Sucesso',
        'Meta criada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding goal:', error);
      
      // Show error message
      Alert.alert(
        'Erro',
        'Não foi possível criar a meta. Tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <GoalForm onSubmit={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AddGoal;