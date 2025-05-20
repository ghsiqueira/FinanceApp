// src/components/MonthSelector.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ selectedDate, onDateChange }) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Formata o mês e ano para exibição
  const formattedDate = format(selectedDate, 'MMMM yyyy', { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Muda para o mês anterior
  const previousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  // Muda para o próximo mês
  const nextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  // Obtém os meses para seleção
  const getMonths = () => {
    const months = [];
    const currentYear = selectedDate.getFullYear();
    
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear, month, 1);
      months.push({
        date,
        label: format(date, 'MMMM', { locale: ptBR }),
      });
    }
    
    return months;
  };

  // Anos para seleção (3 anos para trás e 1 para frente)
  const getYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear - 3; year <= currentYear + 1; year++) {
      years.push(year);
    }
    
    return years;
  };

  // Seleciona um mês e ano específicos
  const selectMonthYear = (month: number, year: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(month);
    newDate.setFullYear(year);
    onDateChange(newDate);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.selector, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={previousMonth} style={styles.arrowButton}>
          <Icon name="chevron-left" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.dateText, { color: theme.text }]}>
            {capitalizedDate}
          </Text>
          <Icon name="calendar" size={20} color={theme.primary} style={styles.calendarIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={nextMonth} style={styles.arrowButton}>
          <Icon name="chevron-right" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Selecione um mês
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.yearSelector}>
              {getYears().map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearButton,
                    selectedDate.getFullYear() === year && { 
                      backgroundColor: theme.primary + '20'
                    }
                  ]}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setFullYear(year);
                    onDateChange(newDate);
                  }}
                >
                  <Text
                    style={[
                      styles.yearText,
                      { color: theme.text },
                      selectedDate.getFullYear() === year && { 
                        color: theme.primary,
                        fontWeight: 'bold'
                      }
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.monthsGrid}>
              {getMonths().map(({ date, label }) => {
                const month = date.getMonth();
                const isSelected = 
                  selectedDate.getMonth() === month && 
                  selectedDate.getFullYear() === date.getFullYear();
                
                return (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.monthButton,
                      isSelected && { 
                        backgroundColor: theme.primary + '20' 
                      }
                    ]}
                    onPress={() => selectMonthYear(month, selectedDate.getFullYear())}
                  >
                    <Text
                      style={[
                        styles.monthText,
                        { color: theme.text },
                        isSelected && { 
                          color: theme.primary,
                          fontWeight: 'bold'
                        }
                      ]}
                    >
                      {label.charAt(0).toUpperCase() + label.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    overflow: 'hidden',
  },
  arrowButton: {
    padding: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarIcon: {
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    padding: 16,
    elevation: 5,
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
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  yearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  yearText: {
    fontSize: 14,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 14,
  },
});

export default MonthSelector;