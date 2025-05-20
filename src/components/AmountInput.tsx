// src/components/AmountInput.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AmountInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  isIncome?: boolean;
}

const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  label = 'Valor',
  placeholder = 'R$ 0,00',
  error,
  isIncome = false,
}) => {
  const { theme } = useTheme();
  const [displayValue, setDisplayValue] = useState('');

  // Atualiza o display quando o valor muda externamente
  useEffect(() => {
    if (value === 0) {
      setDisplayValue('');
    } else {
      // Formata o valor para exibição (sem o símbolo de moeda)
      const formatted = value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setDisplayValue(formatted);
    }
  }, [value]);

  // Converte o valor digitado para número
  const handleChangeText = (text: string) => {
    // Remove todos os caracteres não numéricos
    const digitsOnly = text.replace(/\D/g, '');
    
    // Converte para número (em centavos) e depois para reais
    const numericValue = digitsOnly ? parseFloat(digitsOnly) / 100 : 0;
    
    onChange(numericValue);
    
    // Formata para exibição se houver valor
    if (digitsOnly) {
      const formatted = numericValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      
      <View style={[
        styles.inputContainer, 
        { 
          borderColor: error ? theme.error : theme.border,
          backgroundColor: theme.card
        }
      ]}>
        <Text style={[
          styles.currencySymbol, 
          { 
            color: isIncome ? theme.success : theme.text 
          }
        ]}>
          R$
        </Text>
        
        <TextInput
          style={[
            styles.input,
            { 
              color: isIncome ? theme.success : theme.text,
            }
          ]}
          value={displayValue}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          keyboardType="numeric"
        />
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error}
        </Text>
      )}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default AmountInput;