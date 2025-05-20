// src/utils/formatters.ts

/**
 * Formata um valor numérico para formato de moeda (BRL)
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Formata um valor de porcentagem
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

/**
 * Converte string para número
 */
export const parseNumber = (value: string): number => {
  // Remove caracteres não numéricos, exceto ponto e vírgula
  const cleanValue = value.replace(/[^\d,.]/g, '');
  
  // Converte vírgula para ponto (formato brasileiro para formato internacional)
  const formattedValue = cleanValue.replace(',', '.');
  
  return parseFloat(formattedValue);
};