// src/screens/main/AddTransactionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DatePicker from 'react-native-date-picker';
import { MainScreenProps } from '../../types/navigation';
import { TransactionType, TransactionCategory, CreateTransactionData } from '../../types';
import { addTransaction, updateTransaction } from '../../store/slices/transactionSlice';
import { AppDispatch } from '../../store/store';

type AddTransactionScreenProps = MainScreenProps<'AddTransaction'>;

const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { transaction } = route.params || {};
  const isEditing = !!transaction;

  const [type, setType] = useState<TransactionType>(
    transaction?.type || 'expense'
  );
  const [amount, setAmount] = useState(
    transaction?.amount?.toString() || ''
  );
  const [description, setDescription] = useState(
    transaction?.description || ''
  );
  const [category, setCategory] = useState<TransactionCategory>(
    transaction?.category || 'outros'
  );
  const [date, setDate] = useState(
    transaction ? new Date(transaction.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const categories: { [key in TransactionCategory]: { label: string; icon: string } } = {
    alimentacao: { label: 'Alimentação', icon: 'restaurant' },
    transporte: { label: 'Transporte', icon: 'directions-car' },
    moradia: { label: 'Moradia', icon: 'home' },
    saude: { label: 'Saúde', icon: 'local-hospital' },
    educacao: { label: 'Educação', icon: 'school' },
    lazer: { label: 'Lazer', icon: 'movie' },
    vestuario: { label: 'Vestuário', icon: 'checkroom' },
    servicos: { label: 'Serviços', icon: 'build' },
    investimentos: { label: 'Investimentos', icon: 'trending-up' },
    salario: { label: 'Salário', icon: 'work' },
    freelance: { label: 'Freelance', icon: 'laptop' },
    vendas: { label: 'Vendas', icon: 'shopping-cart' },
    outros: { label: 'Outros', icon: 'more-horiz' },
  };

  const formatCurrency = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Converte para centavos
    const cents = parseInt(numbers) || 0;
    
    // Converte para reais
    const reais = cents / 100;
    
    return reais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const parseCurrency = (value: string): number => {
    const numbers = value.replace(/\D/g, '');
    return parseInt(numbers) / 100 || 0;
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setAmount(formatted);
  };

  const handleSave = async () => {
    const numericAmount = parseCurrency(amount);

    // Validações
    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, adicione uma descrição');
      return;
    }

    if (numericAmount <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido');
      return;
    }

    if (description.length > 200) {
      Alert.alert('Erro', 'Descrição deve ter no máximo 200 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const transactionData: CreateTransactionData = {
        type,
        amount: numericAmount,
        description: description.trim(),
        category,
        date: date.toISOString(),
      };

      if (isEditing && transaction) {
        await dispatch(updateTransaction({
          id: transaction._id,
          data: transactionData
        })).unwrap();
        Alert.alert('Sucesso', 'Transação atualizada com sucesso!');
      } else {
        await dispatch(addTransaction(transactionData)).unwrap();
        Alert.alert('Sucesso', 'Transação adicionada com sucesso!');
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Erro', 
        error instanceof Error ? error.message : 'Erro ao salvar transação'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(false)}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.categoriesList}>
            {Object.entries(categories).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryItem,
                  category === key && styles.categoryItemSelected
                ]}
                onPress={() => {
                  setCategory(key as TransactionCategory);
                  setShowCategoryModal(false);
                }}
              >
                <Icon name={value.icon} size={24} color="#6C63FF" />
                <Text style={styles.categoryLabel}>{value.label}</Text>
                {category === key && (
                  <Icon name="check" size={20} color="#6C63FF" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Editar Transação' : 'Nova Transação'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Tipo de Transação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.typeButtonActive,
                { backgroundColor: type === 'expense' ? '#EF4444' : '#F7FAFC' }
              ]}
              onPress={() => setType('expense')}
            >
              <Icon 
                name="trending-down" 
                size={20} 
                color={type === 'expense' ? '#FFFFFF' : '#EF4444'} 
              />
              <Text style={[
                styles.typeButtonText,
                { color: type === 'expense' ? '#FFFFFF' : '#EF4444' }
              ]}>
                Gasto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && styles.typeButtonActive,
                { backgroundColor: type === 'income' ? '#10B981' : '#F7FAFC' }
              ]}
              onPress={() => setType('income')}
            >
              <Icon 
                name="trending-up" 
                size={20} 
                color={type === 'income' ? '#FFFFFF' : '#10B981'} 
              />
              <Text style={[
                styles.typeButtonText,
                { color: type === 'income' ? '#FFFFFF' : '#10B981' }
              ]}>
                Receita
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Valor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valor</Text>
          <View style={styles.inputContainer}>
            <Icon name="attach-money" size={20} color="#666" />
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="R$ 0,00"
              keyboardType="numeric"
              maxLength={15}
            />
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <View style={styles.inputContainer}>
            <Icon name="description" size={20} color="#666" />
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Almoço no restaurante"
              maxLength={200}
              multiline
              numberOfLines={2}
            />
          </View>
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        {/* Categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoria</Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(true)}
          >
            <Icon name={categories[category].icon} size={20} color="#6C63FF" />
            <Text style={styles.categoryText}>{categories[category].label}</Text>
            <Icon name="keyboard-arrow-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="event" size={20} color="#6C63FF" />
            <Text style={styles.dateText}>
              {date.toLocaleDateString('pt-BR')}
            </Text>
            <Icon name="keyboard-arrow-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker */}
      <DatePicker
        modal
        open={showDatePicker}
        date={date}
        mode="date"
        locale="pt"
        title="Selecionar Data"
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={(selectedDate) => {
          setShowDatePicker(false);
          setDate(selectedDate);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* Category Modal */}
      {renderCategoryModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  closeButton: {
    padding: 4,
  },
  categoriesList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  categoryItemSelected: {
    backgroundColor: '#F0F4FF',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  typeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    paddingVertical: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    paddingVertical: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
    marginTop: 4,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 12,
  },
  categoryText: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84
  },
});

export default AddTransactionScreen;,