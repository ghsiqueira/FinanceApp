// src/screens/Goals.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useGoals } from '../context/GoalContext';
import { Goal } from '../types';
import GoalCard from '../components/GoalCard';

const Goals = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const {
    goals,
    completedGoals,
    inProgressGoals,
    loading,
    error,
    fetchGoals
  } = useGoals();
  
  // Filter state (all, in progress, completed)
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  
  // Refreshing state
  const [refreshing, setRefreshing] = useState(false);
  
  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoals();
    setRefreshing(false);
  };
  
  // Get filtered goals
  const filteredGoals = showCompleted ? completedGoals : inProgressGoals;
  
  // Navigate to goal details
  const handleGoalPress = (goal: Goal) => {
    navigation.navigate('GoalDetails', { goalId: goal._id });
  };
  
  // Navigate to add goal
  const handleAddGoal = () => {
    navigation.navigate('AddGoal');
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Filter Switch */}
      <View style={styles.filterContainer}>
        <Text style={[styles.filterLabel, { color: theme.text }]}>
          {showCompleted ? 'Metas Concluídas' : 'Metas em Andamento'}
        </Text>
        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: theme.textSecondary }]}>
            Mostrar Concluídas
          </Text>
          <Switch
            value={showCompleted}
            onValueChange={setShowCompleted}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={showCompleted ? theme.primary : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Goal List */}
      {loading && !filteredGoals.length ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : filteredGoals.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon 
            name={showCompleted ? "flag-checkered" : "flag-outline"} 
            size={64} 
            color={theme.textSecondary} 
          />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            {showCompleted 
              ? "Você ainda não concluiu nenhuma meta" 
              : "Você não tem nenhuma meta em andamento"
            }
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={handleAddGoal}
          >
            <Text style={styles.addButtonText}>Criar Nova Meta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredGoals}
          renderItem={({ item }) => (
            <GoalCard
              goal={item}
              onPress={handleGoalPress}
            />
          )}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={handleAddGoal}
      >
        <Icon name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 80, // For FAB clearance
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default Goals;