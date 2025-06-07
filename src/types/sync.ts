// src/types/sync.ts
export interface SyncQueue {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'transaction' | 'budget' | 'goal';
  data: any;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
}

// Renomear SyncStatus interface para SyncState
export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: number;
  pendingOperations: number;
  failedOperations: number;
}

// Adicionar enum aqui mesmo
export enum SyncStatusEnum {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error'
}