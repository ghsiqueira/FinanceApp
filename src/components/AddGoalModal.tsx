import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ModalProps } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import DatePickerModal from './DatePickerModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GoalData {
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

const AddGoalModal: React.FC<ModalProps> = ({ visible, onClose }) => {
  const { theme, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const queryClient = useQueryClient();
  
  // Animações
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    }
  }, [visible]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const addMutation = useMutation({
    mutationFn: (data: GoalData) => api.post('/goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      resetForm();
      runOnJS(onClose)();
      runOnJS(() => Alert.alert('Sucesso', 'Meta criada com sucesso! 🎯'))();
    },
    onError: (error) => {
      runOnJS(() => Alert.alert('Erro', 'Não foi possível criar a meta. Tente novamente.'))();
      console.log('Erro ao criar meta:', error);
    }
  });

  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setTargetDate('');
  };

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  const calculateMonthlyTarget = (targetAmount: number, targetDate: string): number => {
    const targetDateObj = new Date(targetDate);
    const now = new Date();
    
    // CÁLCULO MAIS PRECISO DE MESES
    let monthsDiff = (targetDateObj.getFullYear() - now.getFullYear()) * 12 + 
                     (targetDateObj.getMonth() - now.getMonth());
    
    // Se o dia da meta ainda não passou no mês atual, soma 1 mês
    if (targetDateObj.getDate() > now.getDate()) {
      monthsDiff += 1;
    }
    
    // Garantir pelo menos 1 mês
    monthsDiff = Math.max(monthsDiff, 1);
    
    // Arredondar para 2 casas decimais
    const monthlyTarget = targetAmount / monthsDiff;
    return Math.round(monthlyTarget * 100) / 100;
  };

  const handleSubmit = () => {
    if (!title || !targetAmount || !targetDate) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    const numericTargetAmount = parseFloat(targetAmount.replace(',', '.'));
    if (isNaN(numericTargetAmount) || numericTargetAmount <= 0) {
      Alert.alert('Erro', 'Digite um valor alvo válido');
      return;
    }

    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(targetDate)) {
      Alert.alert('Erro', 'Data deve estar no formato DD/MM/AAAA');
      return;
    }

    // Validar se a data não é no passado
    const [day, month, year] = targetDate.split('/');
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const targetDateObj = new Date(formattedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDateObj <= today) {
      Alert.alert('Erro', 'A data limite deve ser no futuro');
      return;
    }

    addMutation.mutate({
      title,
      targetAmount: numericTargetAmount,
      currentAmount: 0, // Nova meta sempre começa com 0
      targetDate: new Date(formattedDate).toISOString(),
    });
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Background Overlay */}
      <Animated.View 
        style={[styles.overlay, backgroundStyle]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View style={[styles.modalContainer, modalStyle]}>
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { 
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border 
          }]}>
            <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, { color: theme.colors.error }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              🎯 Nova Meta
            </Text>
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={styles.headerButton}
              disabled={addMutation.isPending}
            >
              <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>
                {addMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.form} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Nome da Meta */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Nome da Meta *
              </Text>
              <View style={[styles.inputContainer, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }]}>
                <Ionicons 
                  name="flag" 
                  size={20} 
                  color={theme.colors.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ex: Viagem para Europa"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>
            </View>

            {/* Valor Alvo */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Valor Alvo *
              </Text>
              <View style={[styles.inputContainer, {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border
              }]}>
                <Text style={[styles.currencySymbol, { color: theme.colors.primary }]}>
                  R$
                </Text>
                <TextInput
                  style={[styles.amountInput, { color: theme.colors.text }]}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0,00"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Data Limite */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Data Limite *
              </Text>
              <DatePickerModal
                value={targetDate}
                onDateSelect={setTargetDate}
                placeholder="Selecione uma data"
              />
            </View>

            {/* Preview da Meta Mensal */}
            {targetAmount && targetDate && (() => {
              const numericAmount = parseFloat(targetAmount.replace(',', '.'));
              const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
              
              if (!isNaN(numericAmount) && numericAmount > 0 && dateRegex.test(targetDate)) {
                const [day, month, year] = targetDate.split('/');
                const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                const targetDateObj = new Date(formattedDate);
                const today = new Date();
                
                if (targetDateObj > today) {
                  const monthlyTarget = calculateMonthlyTarget(numericAmount, formattedDate);
                  const monthsDiff = Math.max(1, Math.ceil((targetDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
                  
                  return (
                    <View style={[styles.previewSection, { 
                      backgroundColor: `${theme.colors.primary}10`,
                      borderColor: theme.colors.primary 
                    }]}>
                      <View style={styles.previewHeader}>
                        <Ionicons name="calculator" size={20} color={theme.colors.primary} />
                        <Text style={[styles.previewTitle, { color: theme.colors.primary }]}>
                          💡 Preview da Meta
                        </Text>
                      </View>
                      
                      <View style={styles.previewContent}>
                        <View style={styles.previewRow}>
                          <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>
                            Meta mensal necessária:
                          </Text>
                          <Text style={[styles.previewValue, { color: theme.colors.primary }]}>
                            R$ {monthlyTarget.toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2 
                            })}
                          </Text>
                        </View>
                        
                        <View style={styles.previewRow}>
                          <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>
                            Período:
                          </Text>
                          <Text style={[styles.previewValue, { color: theme.colors.text }]}>
                            {monthsDiff} {monthsDiff === 1 ? 'mês' : 'meses'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                }
              }
              return null;
            })()}

            {/* Info Box */}
            <View style={[styles.infoBox, { 
              backgroundColor: `${theme.colors.success}10`,
              borderColor: theme.colors.success 
            }]}>
              <Ionicons name="bulb" size={20} color={theme.colors.success} />
              <Text style={[styles.infoText, { color: theme.colors.success }]}>
                💡 Dica: Defina metas realistas e acompanhe seu progresso regularmente. Você pode ajustar os valores a qualquer momento!
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 80,
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 12,
  },
  previewSection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  previewContent: {
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default AddGoalModal;