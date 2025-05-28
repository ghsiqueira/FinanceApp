import api from './api';
import { Transaction } from '../types';

export const processRecurringTransactions = async () => {
  try {
    const response = await api.get('/transactions');
    const allTransactions: Transaction[] = response.data;
    
    const recurringTransactions = allTransactions.filter(t => t.isRecurring && !t.recurringParentId);
    const today = new Date();
    const processedTransactions = [];

    for (const transaction of recurringTransactions) {
      if (!transaction.isRecurring || !transaction.recurringFrequency) continue;

      // Verificar se ainda está dentro do período (se há data limite)
      if (transaction.recurringEndDate) {
        const endDate = new Date(transaction.recurringEndDate);
        if (today > endDate) continue;
      }

      const lastTransactionDate = new Date(transaction.date);
      const nextDate = getNextRecurringDate(lastTransactionDate, transaction.recurringFrequency);

      // Se chegou a hora de criar a próxima transação
      if (today >= nextDate) {
        const newTransaction = {
          ...transaction,
          _id: undefined,
          date: nextDate.toISOString(),
          recurringParentId: transaction._id,
        };

        try {
          await api.post('/transactions', newTransaction);
          processedTransactions.push(newTransaction);
        } catch (error) {
          console.log('Erro ao criar transação recorrente:', error);
        }
      }
    }

    return processedTransactions;
  } catch (error) {
    console.log('Erro ao processar transações recorrentes:', error);
    return [];
  }
};

const getNextRecurringDate = (lastDate: Date, frequency: string): Date => {
  const nextDate = new Date(lastDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  return nextDate;
};

// Função para executar periodicamente (pode ser chamada no App.tsx)
export const startRecurringTransactionProcessor = () => {
  // Processar ao abrir o app
  processRecurringTransactions();

  // Processar a cada 24 horas
  setInterval(() => {
    processRecurringTransactions();
  }, 24 * 60 * 60 * 1000);
};