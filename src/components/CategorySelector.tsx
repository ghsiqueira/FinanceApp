// src/components/CategorySelector.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../context/CategoryContext';
import { Category } from '../types';

interface CategorySelectorProps {
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
  transactionType: 'income' | 'expense';
  error?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  transactionType,
  error
}) => {
  const { theme } = useTheme();
  const { incomeCategories, expenseCategories } = useCategories();
  const [modalVisible, setModalVisible] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  // Quando o tipo de transação mudar, atualize as categorias filtradas
  useEffect(() => {
    if (transactionType === 'income') {
      setFilteredCategories(incomeCategories);
    } else {
      setFilteredCategories(expenseCategories);
    }
  }, [transactionType, incomeCategories, expenseCategories]);

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => {
        onSelectCategory(item);
        setModalVisible(false);
      }}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
        <Icon name={item.icon} size={20} color={item.color} />
      </View>
      <Text style={[styles.categoryName, { color: theme.text }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>Categoria</Text>
      
      <TouchableOpacity
        style={[
          styles.selector,
          { 
            borderColor: error ? theme.error : theme.border,
            backgroundColor: theme.card 
          }
        ]}
        onPress={() => setModalVisible(true)}
      >
        {selectedCategory ? (
          <View style={styles.selectedCategory}>
            <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color + '20' }]}>
              <Icon name={selectedCategory.icon} size={20} color={selectedCategory.color} />
            </View>
            <Text style={[styles.categoryName, { color: theme.text }]}>
              {selectedCategory.name}
            </Text>
          </View>
        ) : (
          <Text style={[styles.placeholder, { color: theme.textSecondary }]}>
            Selecione uma categoria
          </Text>
        )}
        <Icon name="chevron-down" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
      
      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Selecione uma categoria
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredCategories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item._id || item.name}
              style={styles.categoryList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  placeholder: {
    fontSize: 16,
  },
  selectedCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryList: {
    flexGrow: 0,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});

export default CategorySelector;