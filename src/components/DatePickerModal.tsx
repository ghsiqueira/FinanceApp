import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

interface DatePickerModalProps {
  value: string;
  onDateSelect: (formattedDate: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  value,
  onDateSelect,
  placeholder = 'Selecione uma data',
  disabled = false
}) => {
  const { theme, isDark } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Animações
  const modalOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.9);

  React.useEffect(() => {
    if (showModal) {
      modalOpacity.value = withTiming(1, { duration: 200 });
      modalScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [showModal]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    onDateSelect(formattedDate);
    setShowModal(false);
  };

  const openModal = () => {
    if (disabled) return;
    
    // Se já tem uma data válida, usar ela como inicial
    if (value) {
      const [day, month, year] = value.split('/');
      if (day && month && year) {
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      }
    }
    setShowModal(true);
  };

  return (
    <>
      {/* Input Field */}
      <TouchableOpacity
        style={[
          styles.inputContainer,
          {
            backgroundColor: disabled ? `${theme.colors.border}30` : theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: disabled ? 0.6 : 1,
          }
        ]}
        onPress={openModal}
        activeOpacity={disabled ? 1 : 0.7}
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
            color: value ? theme.colors.text : theme.colors.textSecondary,
            flex: 1
          }
        ]}>
          {value || placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle={isDark ? 'light-content' : 'dark-content'} />
          
          {/* Background */}
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={() => setShowModal(false)}
            activeOpacity={1}
          />

          {/* Calendar Container */}
          <Animated.View style={[
            styles.calendarContainer,
            {
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.shadow || '#000',
            },
            animatedModalStyle
          ]}>
            <SafeAreaView>
              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  📅 Selecionar Data
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Calendar Content */}
              <View style={styles.calendarContent}>
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
                      const isSelected = value === `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
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

                {/* Footer com dica */}
                <View style={[styles.calendarFooter, { borderTopColor: theme.colors.border }]}>
                  <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                    💡 Toque em uma data para selecioná-la
                  </Text>
                </View>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    borderRadius: 20,
    maxWidth: 350,
    width: '100%',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  calendarContent: {
    padding: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 12,
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
    marginBottom: 20,
  },
  daySlot: {
    width: '14.285%', // 100% / 7 days
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  calendarFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});

export default DatePickerModal;