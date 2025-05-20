import { 
  format, 
  addDays, 
  addMonths, 
  addYears, 
  isAfter, 
  isBefore, 
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInDays,
  differenceInMonths,
  parse
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Formatar data em português
export const formatDate = (date: Date | string, formatStr: string = 'dd/MM/yyyy'): string => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: ptBR });
};

// Formatar data com nome do dia da semana
export const formatDateWithWeekday = (date: Date | string): string => {
  return formatDate(date, "EEEE, dd 'de' MMMM 'de' yyyy");
};

// Converter string para Date no formato brasileiro
export const parseDate = (dateStr: string, formatStr: string = 'dd/MM/yyyy'): Date => {
  return parse(dateStr, formatStr, new Date(), { locale: ptBR });
};

/**
 * Tipos de frequência para transações recorrentes
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Calcular próximas datas com base na recorrência
 * @param baseDate Data base para calcular as próximas ocorrências
 * @param frequency Frequência da recorrência
 * @param count Número de datas a calcular
 * @param dayOfWeek Dia da semana (0-6, onde 0 é domingo)
 * @param dayOfMonth Dia do mês (1-31)
 * @param month Mês (0-11, onde 0 é janeiro)
 * @param endDate Data limite (opcional)
 */
export const calculateNextOccurrences = (
  baseDate: Date,
  frequency: RecurrenceFrequency,
  count: number = 5,
  dayOfWeek?: number,
  dayOfMonth?: number,
  month?: number,
  endDate?: Date | null
): Date[] => {
  const occurrences: Date[] = [];
  let currentDate = new Date(baseDate);
  
  // Ensure parameters are valid
  dayOfWeek = dayOfWeek !== undefined ? dayOfWeek % 7 : undefined;
  dayOfMonth = dayOfMonth !== undefined ? Math.max(1, Math.min(31, dayOfMonth)) : undefined;
  month = month !== undefined ? month % 12 : undefined;
  
  // Calculate occurrences
  for (let i = 0; i < count; i++) {
    let nextDate: Date | null = null;
    
    switch (frequency) {
      case 'daily':
        nextDate = addDays(currentDate, 1);
        break;
        
      case 'weekly':
        if (dayOfWeek !== undefined) {
          // Calculate next occurrence of the specified day of week
          const daysUntilNextOccurrence = (dayOfWeek - currentDate.getDay() + 7) % 7;
          nextDate = addDays(currentDate, daysUntilNextOccurrence === 0 ? 7 : daysUntilNextOccurrence);
        } else {
          // Simple weekly without specified day
          nextDate = addDays(currentDate, 7);
        }
        break;
        
      case 'monthly':
        // Next month, same day
        nextDate = addMonths(currentDate, 1);
        
        if (dayOfMonth !== undefined) {
          // Adjust to specified day of month
          const lastDayOfMonth = new Date(
            nextDate.getFullYear(),
            nextDate.getMonth() + 1,
            0
          ).getDate();
          
          // Limit to last day of month
          nextDate.setDate(Math.min(dayOfMonth, lastDayOfMonth));
        }
        break;
        
      case 'yearly':
        if (month !== undefined && dayOfMonth !== undefined) {
          // If the specified month and day has already passed this year, add a year
          const targetDate = new Date(currentDate.getFullYear(), month, dayOfMonth);
          
          if (isBefore(targetDate, currentDate)) {
            nextDate = new Date(currentDate.getFullYear() + 1, month, dayOfMonth);
          } else {
            nextDate = targetDate;
          }
        } else {
          // Simple yearly without specified month/day
          nextDate = addYears(currentDate, 1);
        }
        break;
    }
    
    // Check if beyond end date
    if (endDate && nextDate && isAfter(nextDate, endDate)) {
      break;
    }
    
    if (nextDate) {
      occurrences.push(nextDate);
      currentDate = nextDate;
    }
  }
  
  return occurrences;
};

/**
 * Obter intervalos de datas (para filtros)
 */
export const getDateRanges = () => {
  const today = new Date();
  
  return {
    today: {
      start: startOfDay(today),
      end: endOfDay(today)
    },
    thisWeek: {
      start: startOfWeek(today, { locale: ptBR }),
      end: endOfWeek(today, { locale: ptBR })
    },
    thisMonth: {
      start: startOfMonth(today),
      end: endOfMonth(today)
    },
    thisYear: {
      start: startOfYear(today),
      end: endOfYear(today)
    },
    last7Days: {
      start: addDays(today, -7),
      end: today
    },
    last30Days: {
      start: addDays(today, -30),
      end: today
    },
    last90Days: {
      start: addDays(today, -90),
      end: today
    },
    last12Months: {
      start: addMonths(today, -12),
      end: today
    }
  };
};

/**
 * Verificar se uma data está entre duas outras
 */
export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  return (
    !isBefore(date, startOfDay(startDate)) && 
    !isAfter(date, endOfDay(endDate))
  );
};

/**
 * Formatar duração (para metas, etc)
 */
export const formatDuration = (startDate: Date | string, endDate: Date | string): string => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  const days = differenceInDays(end, start);
  const months = differenceInMonths(end, start);
  
  if (days < 30) {
    return `${days} dia${days !== 1 ? 's' : ''}`;
  } else if (months < 12) {
    return `${months} m${months !== 1 ? 'eses' : 'ês'}`;
  } else {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) {
      return `${years} ano${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} ano${years !== 1 ? 's' : ''} e ${remainingMonths} m${remainingMonths !== 1 ? 'eses' : 'ês'}`;
    }
  }
};

export default {
  formatDate,
  formatDateWithWeekday,
  parseDate,
  calculateNextOccurrences,
  getDateRanges,
  isDateInRange,
  formatDuration
};