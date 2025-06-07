// src/services/sync.ts
import NetInfo from '@react-native-community/netinfo';
import { apiService } from './api';
import { storageService } from './storage';
import { SyncQueue, Transaction, Budget, Goal } from '../types';

class SyncService {
  private isSyncing = false;
  private syncTimeout: NodeJS.Timeout | null = null;
  private listeners: Array<(status: { isSyncing: boolean; isOnline: boolean }) => void> = [];

  constructor() {
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.startSync();
      }
    });
  }

  // Listeners para status de sincronização
  addListener(callback: (status: { isSyncing: boolean; isOnline: boolean }) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (status: { isSyncing: boolean; isOnline: boolean }) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(status: { isSyncing: boolean; isOnline: boolean }) {
    this.listeners.forEach(listener => listener(status));
  }

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  // Iniciar sincronização
  async startSync(): Promise<void> {
    if (this.isSyncing) return;

    const isOnline = await this.isOnline();
    if (!isOnline) return;

    this.isSyncing = true;
    this.notifyListeners({ isSyncing: true, isOnline: true });

    try {
      // 1. Sincronizar dados do servidor
      await this.syncFromServer();
      
      // 2. Enviar mudanças locais
      await this.syncToServer();
      
      // 3. Atualizar timestamp do último sync
      await storageService.setLastSync(Date.now());
      
      console.log('✅ Sincronização completa');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners({ isSyncing: false, isOnline: await this.isOnline() });
    }
  }

  // Buscar dados atualizados do servidor
  private async syncFromServer(): Promise<void> {
    try {
      const lastSync = await storageService.getLastSync();
      const params = lastSync ? `?since=${lastSync}` : '';

      // Buscar transações atualizadas
      const transactionsResponse = await apiService.transactions.getAll();
      if (transactionsResponse.success && transactionsResponse.data) {
        await this.mergeTransactions(transactionsResponse.data);
      }

      // Buscar orçamentos atualizados
      const budgetsResponse = await apiService.budgets.getAll();
      if (budgetsResponse.success && budgetsResponse.data) {
        await this.mergeBudgets(budgetsResponse.data);
      }

      // Buscar metas atualizadas
      const goalsResponse = await apiService.goals.getAll();
      if (goalsResponse.success && goalsResponse.data) {
        await this.mergeGoals(goalsResponse.data);
      }
    } catch (error) {
      console.error('Erro ao sincronizar do servidor:', error);
      throw error;
    }
  }

  // Enviar mudanças locais para o servidor
  private async syncToServer(): Promise<void> {
    const queue = await storageService.getSyncQueue();
    const updatedQueue: SyncQueue[] = [];

    for (const operation of queue) {
      try {
        await this.processOperation(operation);
        console.log(`✅ Operação processada: ${operation.type} ${operation.entity}`);
      } catch (error) {
        console.error(`❌ Erro ao processar operação:`, error);
        
        operation.attempts++;
        operation.lastError = error instanceof Error ? error.message : 'Erro desconhecido';

        // Retentar até 3 vezes
        if (operation.attempts < operation.maxAttempts) {
          updatedQueue.push(operation);
        } else {
          console.error(`❌ Operação descartada após ${operation.maxAttempts} tentativas:`, operation);
        }
      }
    }

    await storageService.updateSyncQueue(updatedQueue);
  }

  // Processar operação individual
  private async processOperation(operation: SyncQueue): Promise<void> {
    const { type, entity, data } = operation;

    switch (entity) {
      case 'transaction':
        await this.processTransactionOperation(type, data);
        break;
      case 'budget':
        await this.processBudgetOperation(type, data);
        break;
      case 'goal':
        await this.processGoalOperation(type, data);
        break;
      default:
        throw new Error(`Entidade desconhecida: ${entity}`);
    }
  }

  // Processar operações de transação
  private async processTransactionOperation(type: string, data: any): Promise<void> {
    switch (type) {
      case 'CREATE':
        const createResponse = await apiService.transactions.create(data);
        if (createResponse.success && createResponse.data) {
          // Atualizar ID local com ID do servidor
          await storageService.updateTransaction(data.clientId, {
            _id: createResponse.data._id,
            isOnline: true
          });
        }
        break;
      case 'UPDATE':
        await apiService.transactions.update(data._id, data);
        break;
      case 'DELETE':
        await apiService.transactions.delete(data._id);
        break;
    }
  }

  // Processar operações de orçamento
  private async processBudgetOperation(type: string, data: any): Promise<void> {
    switch (type) {
      case 'CREATE':
        const createResponse = await apiService.budgets.create(data);
        if (createResponse.success && createResponse.data) {
          await storageService.updateBudget(data.clientId, {
            _id: createResponse.data._id
          });
        }
        break;
      case 'UPDATE':
        await apiService.budgets.update(data._id, data);
        break;
      case 'DELETE':
        await apiService.budgets.delete(data._id);
        break;
    }
  }

  // Processar operações de meta
  private async processGoalOperation(type: string, data: any): Promise<void> {
    switch (type) {
      case 'CREATE':
        const createResponse = await apiService.goals.create(data);
        if (createResponse.success && createResponse.data) {
          await storageService.updateGoal(data.clientId, {
            _id: createResponse.data._id
          });
        }
        break;
      case 'UPDATE':
        await apiService.goals.update(data._id, data);
        break;
      case 'DELETE':
        await apiService.goals.delete(data._id);
        break;
    }
  }

  // Merge de dados (resolver conflitos)
  private async mergeTransactions(serverTransactions: Transaction[]): Promise<void> {
    const localTransactions = await storageService.getTransactions();
    const merged = this.mergeArrays(localTransactions, serverTransactions, '_id');
    await storageService.saveTransactions(merged);
  }

  private async mergeBudgets(serverBudgets: Budget[]): Promise<void> {
    const localBudgets = await storageService.getBudgets();
    const merged = this.mergeArrays(localBudgets, serverBudgets, '_id');
    await storageService.saveBudgets(merged);
  }

  private async mergeGoals(serverGoals: Goal[]): Promise<void> {
    const localGoals = await storageService.getGoals();
    const merged = this.mergeArrays(localGoals, serverGoals, '_id');
    await storageService.saveGoals(merged);
  }

  // Utility para merge de arrays
  private mergeArrays<T extends { [key: string]: any }>(
    local: T[], 
    server: T[], 
    keyField: string
  ): T[] {
    const merged = [...local];
    
    server.forEach(serverItem => {
      const localIndex = merged.findIndex(localItem => 
        localItem[keyField] === serverItem[keyField]
      );
      
      if (localIndex >= 0) {
        // Item existe - usar o mais recente baseado em updatedAt
        const localItem = merged[localIndex];
        const serverUpdated = new Date(serverItem.updatedAt || 0).getTime();
        const localUpdated = new Date(localItem.updatedAt || 0).getTime();
        
        if (serverUpdated > localUpdated) {
          merged[localIndex] = serverItem;
        }
      } else {
        // Item novo do servidor
        merged.push(serverItem);
      }
    });
    
    return merged;
  }

  // Métodos para adicionar operações à fila
  async queueOperation(
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: 'transaction' | 'budget' | 'goal',
    data: any
  ): Promise<void> {
    await storageService.addToSyncQueue({
      type,
      entity,
      data,
      maxAttempts: 3
    });

    // Tentar sincronizar imediatamente se online
    if (await this.isOnline()) {
      this.scheduleSync();
    }
  }

  // Agendar sincronização (debounce)
  private scheduleSync(): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    this.syncTimeout = setTimeout(() => {
      this.startSync();
    }, 2000); // Aguardar 2s antes de sincronizar
  }

  // Forçar sincronização manual
  async forcSync(): Promise<void> {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    await this.startSync();
  }

  // Verificar status da sincronização
  async getSyncStatus() {
    const queue = await storageService.getSyncQueue();
    const lastSync = await storageService.getLastSync();
    const isOnline = await this.isOnline();
    
    return {
      isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: lastSync,
      pendingOperations: queue.length,
      failedOperations: queue.filter(op => op.attempts >= op.maxAttempts).length
    };
  }

  // Limpar dados de sincronização
  async clearSyncData(): Promise<void> {
    await Promise.all([
      storageService.clearSyncQueue(),
      storageService.removeItem('last_sync')
    ]);
  }
}

export const syncService = new SyncService();
export default syncService;