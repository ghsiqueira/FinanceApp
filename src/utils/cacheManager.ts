// src/utils/cacheManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@FinanceAppCache:';
const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

interface CacheItem<T> {
  data: T;
  expiry: number; // timestamp de expiração
}

class CacheManager {
  /**
   * Armazena dados no cache com uma expiração definida
   */
  async setItem<T>(
    key: string, 
    data: T, 
    expiryMs: number = DEFAULT_EXPIRY
  ): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const now = Date.now();
      const item: CacheItem<T> = {
        data,
        expiry: now + expiryMs,
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(item));
    } catch (error) {
      console.error(`Erro ao armazenar item no cache (${key}):`, error);
    }
  }
  
  /**
   * Recupera dados do cache se não estiverem expirados
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const data = await AsyncStorage.getItem(cacheKey);
      
      if (!data) {
        return null;
      }
      
      const item: CacheItem<T> = JSON.parse(data);
      const now = Date.now();
      
      // Verifica se o item expirou
      if (item.expiry < now) {
        // Item expirado, remove do cache
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.error(`Erro ao recuperar item do cache (${key}):`, error);
      return null;
    }
  }
  
  /**
   * Remove um item específico do cache
   */
  async removeItem(key: string): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error(`Erro ao remover item do cache (${key}):`, error);
    }
  }
  
  /**
   * Limpa todo o cache do aplicativo
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
  
  /**
   * Remove itens expirados do cache
   */
  async cleanExpired(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      const now = Date.now();
      
      for (const cacheKey of cacheKeys) {
        const data = await AsyncStorage.getItem(cacheKey);
        if (data) {
          const item = JSON.parse(data);
          if (item.expiry < now) {
            await AsyncStorage.removeItem(cacheKey);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao limpar itens expirados do cache:', error);
    }
  }
}

export default new CacheManager();