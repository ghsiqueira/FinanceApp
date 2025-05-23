// src/services/backupService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Transaction, Category, Goal } from '../types';
import { getData, storeData, STORAGE_KEYS } from '../utils/storage';
import api from './api';

interface BackupData {
  version: string;
  timestamp: string;
  user: {
    id: string;
    email: string;
  };
  data: {
    transactions: Transaction[];
    categories: Category[];
    goals: Goal[];
    settings: any;
  };
}

// Define interface for user data
interface UserData {
  id: string;
  email: string;
  [key: string]: any; // Allow additional properties
}

class BackupService {
  private static instance: BackupService;
  private backupInProgress = false;
  private autoBackupInterval?: NodeJS.Timeout;

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Configura backup automático
   */
  async setupAutoBackup(enabled: boolean = true): Promise<void> {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
    }

    if (enabled) {
      // Backup automático a cada 24 horas
      this.autoBackupInterval = setInterval(async () => {
        try {
          await this.createLocalBackup();
        } catch (error) {
          console.error('Erro no backup automático:', error);
        }
      }, 24 * 60 * 60 * 1000);

      // Executar backup inicial
      setTimeout(() => this.createLocalBackup(), 5000);
    }
  }

  /**
   * Cria backup local dos dados
   */
  async createLocalBackup(): Promise<string> {
    if (this.backupInProgress) {
      throw new Error('Backup já em andamento');
    }

    this.backupInProgress = true;

    try {
      // Buscar dados do usuário com type assertion
      const userData = await getData('@FinanceApp:userData') as UserData | null;
      if (!userData || !userData.id || !userData.email) {
        throw new Error('Usuário não autenticado ou dados incompletos');
      }

      // Buscar todos os dados
      const [transactions, categories, goals, settings] = await Promise.all([
        this.getAllTransactions(),
        this.getAllCategories(),
        this.getAllGoals(),
        getData(STORAGE_KEYS.USER_SETTINGS)
      ]);

      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        user: {
          id: userData.id,
          email: userData.email
        },
        data: {
          transactions,
          categories,
          goals,
          settings: settings || {}
        }
      };

      // Salvar backup localmente
      const backupFileName = `backup_${Date.now()}.json`;
      const backupPath = `${FileSystem.documentDirectory}backups/${backupFileName}`;
      
      // Garantir que o diretório existe
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}backups/`,
        { intermediates: true }
      );

      await FileSystem.writeAsStringAsync(
        backupPath,
        JSON.stringify(backupData, null, 2)
      );

      // Manter apenas os 5 backups mais recentes
      await this.cleanOldBackups();

      // Atualizar última data de backup
      await storeData('@FinanceApp:lastBackup', new Date().toISOString());

      return backupPath;
    } finally {
      this.backupInProgress = false;
    }
  }

  /**
   * Exporta backup para compartilhamento
   */
  async exportBackup(): Promise<string> {
    const backupPath = await this.createLocalBackup();
    return backupPath;
  }

  /**
   * Importa backup de arquivo
   */
  async importBackup(): Promise<void> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      // Check if the operation was cancelled
      if (result.canceled) {
        throw new Error('Backup não selecionado');
      }

      // Access the first asset from the result
      const asset = result.assets[0];
      if (!asset) {
        throw new Error('Nenhum arquivo selecionado');
      }

      const backupContent = await FileSystem.readAsStringAsync(asset.uri);
      const backupData: BackupData = JSON.parse(backupContent);

      // Validar estrutura do backup
      if (!this.validateBackupData(backupData)) {
        throw new Error('Arquivo de backup inválido');
      }

      // Confirmar importação
      const confirmed = await this.confirmImport(backupData);
      if (!confirmed) return;

      // Realizar importação
      await this.restoreFromBackup(backupData);

    } catch (error) {
      console.error('Erro ao importar backup:', error);
      throw error;
    }
  }

  /**
   * Restaura dados do backup
   */
  private async restoreFromBackup(backupData: BackupData): Promise<void> {
    try {
      // Criar backup antes de restaurar
      await this.createLocalBackup();

      // Restaurar dados via API
      const promises = [];

      // Restaurar categorias primeiro
      if (backupData.data.categories.length > 0) {
        promises.push(this.restoreCategories(backupData.data.categories));
      }

      // Restaurar transações
      if (backupData.data.transactions.length > 0) {
        promises.push(this.restoreTransactions(backupData.data.transactions));
      }

      // Restaurar metas
      if (backupData.data.goals.length > 0) {
        promises.push(this.restoreGoals(backupData.data.goals));
      }

      // Restaurar configurações
      if (backupData.data.settings) {
        promises.push(storeData(STORAGE_KEYS.USER_SETTINGS, backupData.data.settings));
      }

      await Promise.all(promises);

    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      throw error;
    }
  }

  /**
   * Sincroniza dados com servidor (se implementado)
   */
  async syncWithServer(): Promise<void> {
    try {
      // Implementar sincronização com servidor
      // Este é um placeholder para funcionalidade futura
      console.log('Sincronização com servidor não implementada ainda');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }

  /**
   * Lista backups locais disponíveis
   */
  async getLocalBackups(): Promise<Array<{name: string, date: Date, size: number}>> {
    try {
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      const backupDirInfo = await FileSystem.getInfoAsync(backupDir);
      
      if (!backupDirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(backupDir);
      const backups = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async (file) => {
            const filePath = `${backupDir}${file}`;
            const fileInfo = await FileSystem.getInfoAsync(filePath);
            
            // Check if file exists and has necessary properties
            if (!fileInfo.exists) {
              return null;
            }

            // Use FileInfo properties correctly based on Expo SDK version
            const modificationTime = 'modificationTime' in fileInfo ? fileInfo.modificationTime : Date.now() / 1000;
            const size = 'size' in fileInfo ? fileInfo.size : 0;
            
            return {
              name: file,
              date: new Date(modificationTime * 1000),
              size: size
            };
          })
      );

      // Filter out null values and sort by date
      return backups
        .filter((backup): backup is NonNullable<typeof backup> => backup !== null)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Erro ao listar backups:', error);
      return [];
    }
  }

  // Métodos auxiliares privados
  private async getAllTransactions(): Promise<Transaction[]> {
    try {
      const response = await api.get('/transactions');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar transações para backup:', error);
      return [];
    }
  }

  private async getAllCategories(): Promise<Category[]> {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias para backup:', error);
      return [];
    }
  }

  private async getAllGoals(): Promise<Goal[]> {
    try {
      const response = await api.get('/goals');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar metas para backup:', error);
      return [];
    }
  }

  private validateBackupData(data: any): boolean {
    return (
      data &&
      data.version &&
      data.timestamp &&
      data.user &&
      data.data &&
      Array.isArray(data.data.transactions) &&
      Array.isArray(data.data.categories) &&
      Array.isArray(data.data.goals)
    );
  }

  private async confirmImport(backupData: BackupData): Promise<boolean> {
    // Este método deve ser implementado na interface
    // Por agora, sempre retorna true
    return true;
  }

  private async restoreCategories(categories: Category[]): Promise<void> {
    for (const category of categories) {
      try {
        // Remove ID para criar nova categoria
        const { _id, ...categoryData } = category as any;
        await api.post('/categories', categoryData);
      } catch (error) {
        console.error('Erro ao restaurar categoria:', error);
      }
    }
  }

  private async restoreTransactions(transactions: Transaction[]): Promise<void> {
    for (const transaction of transactions) {
      try {
        // Remove ID para criar nova transação
        const { _id, ...transactionData } = transaction as any;
        await api.post('/transactions', transactionData);
      } catch (error) {
        console.error('Erro ao restaurar transação:', error);
      }
    }
  }

  private async restoreGoals(goals: Goal[]): Promise<void> {
    for (const goal of goals) {
      try {
        // Remove ID para criar nova meta
        const { _id, ...goalData } = goal as any;
        await api.post('/goals', goalData);
      } catch (error) {
        console.error('Erro ao restaurar meta:', error);
      }
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.getLocalBackups();
      
      // Manter apenas os 5 mais recentes
      const backupsToDelete = backups.slice(5);
      
      for (const backup of backupsToDelete) {
        const filePath = `${FileSystem.documentDirectory}backups/${backup.name}`;
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }
    } catch (error) {
      console.error('Erro ao limpar backups antigos:', error);
    }
  }
}

export default BackupService.getInstance();