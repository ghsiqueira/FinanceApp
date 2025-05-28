import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ModalProps } from '../types';

interface GoalData {
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

const AddGoalModal: React.FC<ModalProps> = ({ visible, onClose }) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data: GoalData) => api.post('/goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      resetForm();
      onClose();
      Alert.alert('Sucesso', 'Meta criada');
    },
  });

  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setTargetDate('');
  };

  const handleSubmit = () => {
    if (!title || !targetAmount || !targetDate) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(targetDate)) {
      Alert.alert('Erro', 'Data deve estar no formato DD/MM/AAAA');
      return;
    }

    const [day, month, year] = targetDate.split('/');
    const formattedDate = `${year}-${month}-${day}`;

    addMutation.mutate({
      title,
      targetAmount: parseFloat(targetAmount.replace(',', '.')),
      currentAmount: 0, // Nova meta sempre começa com 0
      targetDate: formattedDate,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nova Meta</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.saveButton}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form}>
          <Text style={styles.label}>Nome da Meta</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Viagem para Europa"
          />

          <Text style={styles.label}>Valor Alvo</Text>
          <TextInput
            style={styles.input}
            value={targetAmount}
            onChangeText={setTargetAmount}
            placeholder="0,00"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Data Limite</Text>
          <TextInput
            style={styles.input}
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="DD/MM/AAAA"
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Após criar a meta, calcularemos automaticamente quanto você precisa guardar por mês para atingir seu objetivo!
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    color: '#E74C3C',
    fontSize: 16,
  },
  saveButton: {
    color: '#2E86AB',
    fontSize: 16,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#2E86AB',
    textAlign: 'center',
  },
});

export default AddGoalModal;