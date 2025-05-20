// src/screens/Categories.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../context/CategoryContext';
import { Category } from '../types';

interface CategoryItemProps {
  category: Category;
  onPress: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, onPress, onDelete }) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[styles.categoryItem, { backgroundColor: theme.card }]}
      onPress={() => onPress(category)}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
        <Icon name={category.icon} size={24} color={category.color} />
      </View>
      
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryName, { color: theme.text }]}>
          {category.name}
        </Text>
        <Text style={[styles.categoryType, { color: theme.textSecondary }]}>
          {category.type === 'income' ? 'Receita' : 
           category.type === 'expense' ? 'Despesa' : 'Ambos'}
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(category)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="trash-can-outline" size={22} color={theme.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const Categories = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { categories, deleteCategory, loading, error, fetchCategories } = useCategories();
  
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Filter states
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'both'>('all');
  
  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };
  
  // Filter categories by type
  const filteredCategories = filterType === 'all'
    ? categories
    : categories.filter(category => category.type === filterType || category.type === 'both');
  
  // Navigate to edit category
  const handleCategoryPress = (category: Category) => {
    navigation.navigate('AddCategory', { category });
  };
  
  // Handle delete category
  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir a categoria "${category.name}"? Essa ação não poderá ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            if (!category._id) return;
            
            setDeleting(category._id);
            try {
              await deleteCategory(category._id);
            } catch (error: any) {
              // If error contains message about category being used, show appropriate message
              if (error.message && error.message.includes('sendo usada')) {
                Alert.alert(
                  'Não é possível excluir',
                  'Esta categoria está sendo usada em transações ou metas existentes.'
                );
              } else {
                Alert.alert(
                  'Erro',
                  'Não foi possível excluir a categoria. Tente novamente.'
                );
              }
            } finally {
              setDeleting(null);
            }
          }
        }
      ]
    );
  };
  
  // Navigate to add category
  const handleAddCategory = () => {
    navigation.navigate('AddCategory');
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'all' && [
                styles.activeFilterTab,
                { borderColor: theme.primary }
              ]
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text
              style={[
                styles.filterText,
                filterType === 'all' && { color: theme.primary, fontWeight: 'bold' }
              ]}
            >
              Todas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'income' && [
                styles.activeFilterTab,
                { borderColor: '#28a745' }
              ]
            ]}
            onPress={() => setFilterType('income')}
          >
            <Text
              style={[
                styles.filterText,
                filterType === 'income' && { color: '#28a745', fontWeight: 'bold' }
              ]}
            >
              Receitas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'expense' && [
                styles.activeFilterTab,
                { borderColor: '#dc3545' }
              ]
            ]}
            onPress={() => setFilterType('expense')}
          >
            <Text
              style={[
                styles.filterText,
                filterType === 'expense' && { color: '#dc3545', fontWeight: 'bold' }
              ]}
            >
              Despesas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterTab,
              filterType === 'both' && [
                styles.activeFilterTab,
                { borderColor: theme.primary }
              ]
            ]}
            onPress={() => setFilterType('both')}
          >
            <Text
              style={[
                styles.filterText,
                filterType === 'both' && { color: theme.primary, fontWeight: 'bold' }
              ]}
            >
              Ambos
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Category List */}
      {loading && !filteredCategories.length ? (
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
      ) : filteredCategories.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="tag-off" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            Nenhuma categoria encontrada
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={handleAddCategory}
          >
            <Text style={styles.addButtonText}>Adicionar Categoria</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={({ item }) => (
            <CategoryItem
              category={item}
              onPress={handleCategoryPress}
              onDelete={handleDeleteCategory}
            />
          )}
          keyExtractor={item => item._id || item.name}
          contentContainerStyle={styles.listContent}
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
        onPress={handleAddCategory}
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
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterTab: {
    borderWidth: 2,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingBottom: 80,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryType: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
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

export default Categories;