import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { storageService } from '../../services/storage';
import { syncService } from '../../services/sync';
import { Transaction, CreateTransactionData } from '../../types';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: TransactionState = {
  transactions: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Primeiro, tentar buscar do storage local
      const localTransactions = await storageService.getTransactions();
      
      // Se estiver online, buscar do servidor
      if (await apiService.isOnline()) {
        const response = await apiService.transactions.getAll();
        
        if (response.success && response.data) {
          // Salvar no storage local
          await storageService.saveTransactions(response.data);
          return response.data;
        }
      }
      
      // Se offline ou erro na API, retornar dados locais
      return localTransactions;
    } catch (error: any) {
      // Em caso de erro, tentar retornar dados locais
      const localTransactions = await storageService.getTransactions();
      if (localTransactions.length > 0) {
        return localTransactions;
      }
      
      const message = error.response?.data?.message || error.message || 'Erro ao buscar transações';
      return rejectWithValue(message);
    }
  }
);

export const addTransaction = createAsyncThunk(
  'transactions/add',
  async (transactionData: CreateTransactionData, { rejectWithValue }) => {
    try {
      // Gerar ID temporário para uso offline
      const tempId = await storageService.generateOfflineId();
      
      const newTransaction: Transaction = {
        _id: tempId,
        userId: 'current_user', // Será atualizado no servidor
        ...transactionData,
        date: transactionData.date || new Date().toISOString(),
        isOnline: false,
        clientId: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Salvar localmente primeiro
      await storageService.addTransaction(newTransaction);
      
      // Adicionar à fila de sincronização
      await syncService.queueOperation('CREATE', 'transaction', {
        ...transactionData,
        clientId: tempId,
      });

      return newTransaction;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao adicionar transação';
      return rejectWithValue(message);
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/update',
  async ({ id, data }: { id: string; data: Partial<CreateTransactionData> }, { rejectWithValue }) => {
    try {
      // Atualizar localmente primeiro
      await storageService.updateTransaction(id, { ...data, updatedAt: new Date().toISOString() });
      
      // Se for ID offline, adicionar à fila de sincronização
      if (await storageService.isOfflineId(id)) {
        await syncService.queueOperation('UPDATE', 'transaction', { _id: id, ...data });
      } else {
        // Se for ID do servidor, tentar atualizar online ou adicionar à fila
        if (await apiService.isOnline()) {
          try {
            const response = await apiService.transactions.update(id, data);
            if (response.success && response.data) {
              return response.data;
            }
          } catch (error) {
            // Se falhar, adicionar à fila
            await syncService.queueOperation('UPDATE', 'transaction', { _id: id, ...data });
          }
        } else {
          await syncService.queueOperation('UPDATE', 'transaction', { _id: id, ...data });
        }
      }

      // Retornar transação atualizada do storage local
      const transactions = await storageService.getTransactions();
      const updatedTransaction = transactions.find(t => t._id === id);
      
      if (updatedTransaction) {
        return updatedTransaction;
      } else {
        throw new Error('Transação não encontrada');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao atualizar transação';
      return rejectWithValue(message);
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      // Remover localmente primeiro
      await storageService.deleteTransaction(id);
      
      // Adicionar à fila de sincronização se necessário
      if (!(await storageService.isOfflineId(id))) {
        await syncService.queueOperation('DELETE', 'transaction', { _id: id });
      }

      return id;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao deletar transação';
      return rejectWithValue(message);
    }
  }
);

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTransactions: (state, action) => {
      state.transactions = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Add transaction
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.transactions.unshift(action.payload);
      })
      .addCase(addTransaction.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Update transaction
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const index = state.transactions.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Delete transaction
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter(t => t._id !== action.payload);
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setTransactions } = transactionSlice.actions;
export default transactionSlice.reducer;
