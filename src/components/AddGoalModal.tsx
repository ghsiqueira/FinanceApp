import React, { useState, useEffect, useRef } from 'react';
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
  Platform,
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const queryClient = useQueryClient();
  
  // Ref para medir a posição do campo de data
  const dateFieldRef = useRef<View>(null);
  const [dateFieldLayout, setDateFieldLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Animações
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const dropdownOpacity = useSharedValue(0);
  const dropdownScale = useSharedValue(0.95);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    }
  }, [visible]);

  useEffect(() => {
    if (showDatePicker) {
      dropdownOpacity.value = withTiming(1, { duration: 200 });
      dropdownScale.value = withSpring(1, { damping: 12, stiffness: 120 });
    } else {
      dropdownOpacity.value = withTiming(0, { duration: 150 });
      dropdownScale.value = withTiming(0.95, { duration: 150 });
    }
  }, [showDatePicker]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const dropdownStyle = useAnimatedStyle(() => ({
    opacity: dropdownOpacity.value,
    transform: [{ scale: dropdownScale.value }],
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
    setSelectedDate(new Date());
    setShowDatePicker(false);
  };

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    setTargetDate(formattedDate);
    setShowDatePicker(false);
  };

  const toggleDatePicker = () => {
    if (showDatePicker) {
      // Se está aberto, fechar
      setShowDatePicker(false);
    } else {
      // Se está fechado, abrir
      // Medir a posição do campo de data
      if (dateFieldRef.current) {
        dateFieldRef.current.measure((x, y, width, height, pageX, pageY) => {
          setDateFieldLayout({ x: pageX, y: pageY, width, height });
        });
      }

      // Se já tem uma data válida, usar ela como inicial
      if (targetDate) {
        const [day, month, year] = targetDate.split('/');
        if (day && month && year) {
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            setSelectedDate(date);
          }
        }
      }
      setShowDatePicker(true);
    }
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
          onPress={() => {
            if (showDatePicker) {
              setShowDatePicker(false);
            } else {
              handleClose();
            }
          }}
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
              <View ref={dateFieldRef}>
                <TouchableOpacity
                  style={[styles.inputContainer, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderBottomLeftRadius: showDatePicker ? 0 : 12,
                    borderBottomRightRadius: showDatePicker ? 0 : 12,
                  }]}
                  onPress={toggleDatePicker}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="calendar" 
                    size={20} 
                    color={theme.colors.textSecondary}
                    style={{ marginRight: 12 }}
                  />
                  <Text style={[
                    styles.dateText, 
                    { 
                      color: targetDate ? theme.colors.text : theme.colors.textSecondary,
                      flex: 1
                    }
                  ]}>
                    {targetDate || 'Selecione uma data'}
                  </Text>
                  <Ionicons 
                    name={showDatePicker ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <Animated.View style={[
                  styles.datePickerDropdown, 
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    shadowColor: theme.colors.shadow || '#000',
                  },
                  dropdownStyle
                ]}>
                  {/* Navegação do Mês */}
                  <View style={styles.monthNavigation}>
                    <TouchableOpacity 
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setSelectedDate(newDate);
                      }}
                      style={[styles.navButton, { backgroundColor: `${theme.colors.primary}15` }]}
                    >
                      <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    
                    <Text style={[styles.monthYearText, { color: theme.colors.text }]}>
                      {selectedDate.toLocaleDateString('pt-BR', { 
                        month: 'long', 
                        year: 'numeric' 
                      }).replace(/^\w/, c => c.toUpperCase())}
                    </Text>
                    
                    <TouchableOpacity 
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedDate(newDate);
                      }}
                      style={[styles.navButton, { backgroundColor: `${theme.colors.primary}15` }]}
                    >
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* Cabeçalho dos Dias */}
                  <View style={styles.weekHeader}>
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                      <Text key={index} style={[styles.weekDay, { color: theme.colors.textSecondary }]}>
                        {day}
                      </Text>
                    ))}
                  </View>

                  {/* Grid dos Dias */}
                  <View style={styles.daysGrid}>
                    {(() => {
                      const year = selectedDate.getFullYear();
                      const month = selectedDate.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const daysInMonth = lastDay.getDate();
                      const startingDay = firstDay.getDay();
                      
                      const days = [];
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);

                      // Dias vazios antes do primeiro dia do mês
                      for (let i = 0; i < startingDay; i++) {
                        days.push(<View key={`empty-${i}`} style={styles.daySlot} />);
                      }

                      // Dias do mês
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dayDate = new Date(year, month, day);
                        const isToday = dayDate.getTime() === today.getTime();
                        const isSelected = targetDate === `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
                        const isPast = dayDate < today;

                        days.push(
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.daySlot,
                              isSelected && { backgroundColor: theme.colors.primary },
                              isToday && !isSelected && { 
                                borderWidth: 2, 
                                borderColor: theme.colors.primary 
                              },
                              isPast && { opacity: 0.3 }
                            ]}
                            onPress={() => !isPast && handleDateSelect(dayDate)}
                            disabled={isPast}
                            activeOpacity={0.7}
                          >
                            <Text style={[
                              styles.dayNumber,
                              { 
                                color: isSelected ? '#FFFFFF' : 
                                       isToday ? theme.colors.primary : 
                                       theme.colors.text 
                              },
                              (isToday || isSelected) && { fontWeight: 'bold' }
                            ]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      }

                      return days;
                    })()}
                  </View>
                </Animated.View>
              )}
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
    position: 'relative',
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
  dateText: {
    fontSize: 16,
    paddingVertical: 12,
  },
  datePickerDropdown: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    marginTop: -1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  daySlot: {
    width: '14.285%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
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