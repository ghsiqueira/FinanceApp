// src/components/CategoryForm.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Modal,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { Category } from '../types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';

interface CategoryFormProps {
  initialValues?: Partial<Category>;
  onSubmit: (category: Category) => void;
  isEditing?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  initialValues,
  onSubmit,
  isEditing = false
}) => {
  const { theme } = useTheme();
  
  // Form state
  const [name, setName] = useState<string>(initialValues?.name || '');
  const [color, setColor] = useState<string>(initialValues?.color || CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState<string>(initialValues?.icon || CATEGORY_ICONS[0]);
  const [type, setType] = useState<'income' | 'expense' | 'both'>(initialValues?.type || 'both');
  
  // Form UI state
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showIconPicker, setShowIconPicker] = useState<boolean>(false);
  
  // Form validation
  const [errors, setErrors] = useState<{
    name?: string;
  }>({});
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
    } = {};
    
    if (!name.trim()) {
      newErrors.name = 'O nome é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      const category: Category = {
        _id: initialValues?._id,
        name,
        color,
        icon,
        type,
      };
      
      onSubmit(category);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Nome</Text>
          <TextInput
            style={[
              styles.input,
              { 
                color: theme.text,
                borderColor: errors.name ? theme.error : theme.border,
                backgroundColor: theme.card
              }
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Alimentação, Transporte, etc."
            placeholderTextColor={theme.textSecondary}
          />
          {errors.name && (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.name}
            </Text>
          )}
        </View>
        
        {/* Type Selector */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Tipo</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && styles.activeTypeButton,
                type === 'income' && { backgroundColor: '#28a745' }
              ]}
              onPress={() => setType('income')}
            >
              <Icon 
                name="arrow-down" 
                size={24} 
                color={type === 'income' ? '#ffffff' : theme.textSecondary} 
              />
              <Text 
                style={[
                  styles.typeButtonText,
                  { color: type === 'income' ? '#ffffff' : theme.textSecondary }
                ]}
              >
                Receita
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.activeTypeButton,
                type === 'expense' && { backgroundColor: '#dc3545' }
              ]}
              onPress={() => setType('expense')}
            >
              <Icon 
                name="arrow-up" 
                size={24} 
                color={type === 'expense' ? '#ffffff' : theme.textSecondary} 
              />
              <Text 
                style={[
                  styles.typeButtonText,
                  { color: type === 'expense' ? '#ffffff' : theme.textSecondary }
                ]}
              >
                Despesa
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'both' && styles.activeTypeButton,
                type === 'both' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setType('both')}
            >
              <Icon 
                name="swap-horizontal" 
                size={24} 
                color={type === 'both' ? '#ffffff' : theme.textSecondary} 
              />
              <Text 
                style={[
                  styles.typeButtonText,
                  { color: type === 'both' ? '#ffffff' : theme.textSecondary }
                ]}
              >
                Ambos
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Color Picker */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Cor</Text>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              { borderColor: theme.border, backgroundColor: theme.card }
            ]}
            onPress={() => setShowColorPicker(true)}
          >
            <View style={[styles.colorPreview, { backgroundColor: color }]} />
            <Text style={[styles.pickerButtonText, { color: theme.text }]}>
              Selecionar Cor
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Icon Picker */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Ícone</Text>
          <TouchableOpacity
            style={[
              styles.pickerButton,
              { borderColor: theme.border, backgroundColor: theme.card }
            ]}
            onPress={() => setShowIconPicker(true)}
          >
            <View style={[styles.iconPreview, { backgroundColor: color + '20' }]}>
              <Icon name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.pickerButtonText, { color: theme.text }]}>
              Selecionar Ícone
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Atualizar' : 'Criar'} Categoria
          </Text>
        </TouchableOpacity>
        
        {/* Color Picker Modal */}
        <Modal
          visible={showColorPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowColorPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowColorPicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.pickerContainer, { backgroundColor: theme.card }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                      Escolha uma cor
                    </Text>
                    <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                      <Icon name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  <FlatList
                    data={CATEGORY_COLORS}
                    numColumns={4}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.colorItem,
                          { borderColor: item === color ? theme.primary : 'transparent' }
                        ]}
                        onPress={() => {
                          setColor(item);
                          setShowColorPicker(false);
                        }}
                      >
                        <View 
                          style={[
                            styles.colorSwatch, 
                            { backgroundColor: item }
                          ]} 
                        />
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        
        {/* Icon Picker Modal */}
        <Modal
          visible={showIconPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowIconPicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowIconPicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.pickerContainer, { backgroundColor: theme.card }]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>
                      Escolha um ícone
                    </Text>
                    <TouchableOpacity onPress={() => setShowIconPicker(false)}>
                      <Icon name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  <FlatList
                    data={CATEGORY_ICONS}
                    numColumns={5}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.iconItem,
                          { 
                            borderColor: item === icon ? theme.primary : 'transparent',
                            backgroundColor: item === icon ? color + '20' : 'transparent'
                          }
                        ]}
                        onPress={() => {
                          setIcon(item);
                          setShowIconPicker(false);
                        }}
                      >
                        <Icon name={item} size={28} color={color} />
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  activeTypeButton: {
    backgroundColor: '#6200ee',
  },
  typeButtonText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  iconPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 16,
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
  colorItem: {
    width: '25%',
    aspectRatio: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 8,
  },
  colorSwatch: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  iconItem: {
    width: '20%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 8,
    margin: 5,
  },
});

export default CategoryForm;