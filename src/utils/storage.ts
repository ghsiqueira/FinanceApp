// src/utils/storage.ts (atualizado com STORAGE_KEYS exportado)
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chaves de armazenamento
export const STORAGE_KEYS = {
  USER_SETTINGS: '@FinanceApp:userSettings',
  LAST_SYNC: '@FinanceApp:lastSync',
  THEME: '@FinanceApp:theme',
  HIDE_VALUES: '@FinanceApp:hideValues'
};

/**
 * Armazena dados no AsyncStorage
 */
export const storeData = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Erro ao salvar dados no AsyncStorage:', error);
    throw error;
  }
};

/**
 * Recupera dados do AsyncStorage
 */
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Erro ao recuperar dados do AsyncStorage:', error);
    throw error;
  }
};

/**
 * Remove dados do AsyncStorage
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Erro ao remover dados do AsyncStorage:', error);
    throw error;
  }
};

// Interface para as configurações do usuário
export interface UserSettings {
  notificationsEnabled?: boolean;
  // Adicione outras configurações conforme necessário
}

/**
 * Salva configurações do usuário
 */
export const saveUserSettings = async (settings: UserSettings): Promise<void> => {
  // Carregar configurações atuais primeiro
  const currentSettings = await getData<UserSettings>(STORAGE_KEYS.USER_SETTINGS) || {};
  
  // Mesclar com as novas configurações
  const updatedSettings = {
    ...currentSettings,
    ...settings
  };
  
  // Salvar configurações atualizadas
  await storeData(STORAGE_KEYS.USER_SETTINGS, updatedSettings);
};

/**
 * Recupera configurações do usuário
 */
export const getUserSettings = async (): Promise<UserSettings | null> => {
  return await getData<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
};

/**
 * Salva data da última sincronização
 */
export const saveLastSync = async (): Promise<void> => {
  await storeData(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
};

/**
 * Recupera data da última sincronização
 */
export const getLastSync = async (): Promise<string | null> => {
  return await getData<string>(STORAGE_KEYS.LAST_SYNC);
};

/**
 * Salva tema selecionado
 */
export const saveTheme = async (isDarkMode: boolean): Promise<void> => {
  await storeData(STORAGE_KEYS.THEME, { isDarkMode });
};

/**
 * Recupera tema selecionado
 */
export const getTheme = async (): Promise<{ isDarkMode: boolean } | null> => {
  return await getData<{ isDarkMode: boolean }>(STORAGE_KEYS.THEME);
};

export default {
  storeData,
  getData,
  removeData,
  saveUserSettings,
  getUserSettings,
  saveLastSync,
  getLastSync,
  saveTheme,
  getTheme,
  STORAGE_KEYS
};