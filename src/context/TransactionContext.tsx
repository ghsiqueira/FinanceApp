// src/context/TransactionContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Transaction, MonthlySummary } from '../types';
import transactionService from '../services/transactionService';

interface TransactionContextData {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  monthlySummary: MonthlySummary | null;
  fetchTransactions: () => Promise<void>;
  fetchMonthlySummary: (year: number, month: number) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<Transaction>;
  updateTransaction: (id: string, transaction: Transaction) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextData>({} as TransactionContextData);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar todas as transações
  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionService.getAll();
      setTransactions(data);
    } catch (err) {
      setError('Erro ao buscar transações. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar resumo mensal
  const fetchMonthlySummary = async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionService.getMonthlySummary(year, month);
      setMonthlySummary(data);
    } catch (err) {
      setError('Erro ao buscar resumo mensal. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova transação
  const addTransaction = async (transaction: Transaction): Promise<Transaction> => {
    setLoading(true);
    setError(null);
    try {
      const newTransaction = await transactionService.create(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (err) {
      setError('Erro ao adicionar transação. Tente novamente.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar transação existente
  const updateTransaction = async (id: string, transaction: Transaction): Promise<Transaction> => {
    setLoading(true);
    setError(null);
    try {
      const updatedTransaction = await transactionService.update(id, transaction);
      setTransactions(prev => 
        prev.map(t => t._id === id ? updatedTransaction : t)
      );
      return updatedTransaction;
    } catch (err) {
      setError('Erro ao atualizar transação. Tente novamente.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir transação
  const deleteTransaction = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await transactionService.delete(id);
      setTransactions(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      setError('Erro ao excluir transação. Tente novamente.');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Carregar transações ao iniciar
  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <TransactionContext.Provider value={{
      transactions,
      loading,
      error,
      monthlySummary,
      fetchTransactions,
      fetchMonthlySummary,
      addTransaction,
      updateTransaction,
      deleteTransaction
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => useContext(TransactionContext);