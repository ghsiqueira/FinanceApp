// src/screens/Settings.tsx - Versão atualizada com backup e novas funcionalidades
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { 
  getData, 
  saveUserSettings, 
  storeData, 
  STORAGE_KEYS
} from '../utils/storage';
import { DEFAULT_SETTINGS } from '../constants';
import BackupService from '../services/backupService';
import NotificationService from '../services/notificationService';
import BudgetService from '../services/budgetService';

// Extended UserSettings interface with new properties
interface ExtendedUserSettings {
  notificationsEnabled?: boolean;
  autoBackup?: boolean;
  budgetAlerts?: boolean;
  [key: string]: any; // Allow additional properties
}

const Settings = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  
  // App settings
  const [hideValues, setHideValues] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [autoBackup, setAutoBackup] = useState<boolean>(true);
  const [budgetAlerts, setBudgetAlerts] = useState<boolean>(true);
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [backupLoading, setBackupLoading] = useState<boolean>(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load hide values preference
        const hideValuesPreference = await getData<boolean>(STORAGE_KEYS.HIDE_VALUES);
        if (hideValuesPreference !== null) {
          setHideValues(hideValuesPreference);
        }
        
        // Load user settings with extended interface
        const userSettings = await getData<ExtendedUserSettings>(STORAGE_KEYS.USER_SETTINGS);
        if (userSettings) {
          setNotificationsEnabled(userSettings.notificationsEnabled ?? true);
          setAutoBackup(userSettings.autoBackup ?? true);
          setBudgetAlerts(userSettings.budgetAlerts ?? true);
        }

        // Load last backup date
        const lastBackup = await getData<string>('@FinanceApp:lastBackup');
        setLastBackupDate(lastBackup);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Initialize backup service
  useEffect(() => {
    if (autoBackup) {
      BackupService.setupAutoBackup(true);
    }
  }, [autoBackup]);
  
  // Save extended user settings
  const saveExtendedUserSettings = async (settings: Partial<ExtendedUserSettings>) => {
    try {
      const currentSettings = await getData<ExtendedUserSettings>(STORAGE_KEYS.USER_SETTINGS) || {};
      const updatedSettings = { ...currentSettings, ...settings };
      await storeData(STORAGE_KEYS.USER_SETTINGS, updatedSettings);
    } catch (error) {
      console.error('Error saving extended user settings:', error);
      throw error;
    }
  };

  // Toggle hide values
  const handleToggleHideValues = async (value: boolean) => {
    setHideValues(value);
    try {
      await storeData(STORAGE_KEYS.HIDE_VALUES, value);
    } catch (error) {
      console.error('Error saving hide values preference:', error);
    }
  };
  
  // Toggle notifications
  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await saveExtendedUserSettings({ notificationsEnabled: value });
      await NotificationService.setNotificationsEnabled(value);
    } catch (error) {
      console.error('Error saving notifications preference:', error);
    }
  };

  // Toggle auto backup
  const handleToggleAutoBackup = async (value: boolean) => {
    setAutoBackup(value);
    try {
      await saveExtendedUserSettings({ autoBackup: value });
      await BackupService.setupAutoBackup(value);
    } catch (error) {
      console.error('Error saving auto backup preference:', error);
    }
  };

  // Toggle budget alerts
  const handleToggleBudgetAlerts = async (value: boolean) => {
    setBudgetAlerts(value);
    try {
      await saveExtendedUserSettings({ budgetAlerts: value });
      const budgetSettings = await BudgetService.getBudgetSettings();
      await BudgetService.saveBudgetSettings({
        ...budgetSettings,
        enableAlerts: value
      });
    } catch (error) {
      console.error('Error saving budget alerts preference:', error);
    }
  };

  // Manual backup
  const handleManualBackup = async () => {
    setBackupLoading(true);
    try {
      const backupPath = await BackupService.exportBackup();
      const now = new Date().toISOString();
      setLastBackupDate(now);
      
      Alert.alert(
        'Backup Concluído',
        'Backup dos seus dados foi criado com sucesso!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert(
        'Erro no Backup',
        'Não foi possível criar o backup. Tente novamente.'
      );
    } finally {
      setBackupLoading(false);
    }
  };

  // Import backup
  const handleImportBackup = async () => {
    Alert.alert(
      'Importar Backup',
      'Esta ação irá substituir todos os seus dados atuais. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: async () => {
            try {
              await BackupService.importBackup();
              Alert.alert(
                'Sucesso',
                'Backup importado com sucesso! Reinicie o aplicativo para ver as mudanças.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error importing backup:', error);
              Alert.alert(
                'Erro',
                'Não foi possível importar o backup. Verifique se o arquivo é válido.'
              );
            }
          }
        }
      ]
    );
  };

  // View backup history
  const handleViewBackupHistory = async () => {
    try {
      const backups = await BackupService.getLocalBackups();
      if (backups.length === 0) {
        Alert.alert('Backups', 'Nenhum backup local encontrado.');
        return;
      }

      const backupList = backups
        .map((backup, index) => 
          `${index + 1}. ${backup.name}\n   Data: ${backup.date.toLocaleDateString('pt-BR')}\n   Tamanho: ${(backup.size / 1024).toFixed(1)} KB`
        )
        .join('\n\n');

      Alert.alert('Histórico de Backups', backupList);
    } catch (error) {
      console.error('Error loading backup history:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico de backups.');
    }
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
            }
          }
        }
      ]
    );
  };

  // Reset all settings
  const handleResetSettings = () => {
    Alert.alert(
      'Restaurar Configurações',
      'Tem certeza que deseja restaurar todas as configurações para os valores padrão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Restaurar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await storeData(STORAGE_KEYS.HIDE_VALUES, DEFAULT_SETTINGS.hideValues);
              await saveExtendedUserSettings({
                notificationsEnabled: DEFAULT_SETTINGS.notificationsEnabled,
                autoBackup: true,
                budgetAlerts: true
              });
              
              // Update state
              setHideValues(DEFAULT_SETTINGS.hideValues);
              setNotificationsEnabled(DEFAULT_SETTINGS.notificationsEnabled);
              setAutoBackup(true);
              setBudgetAlerts(true);
              
              Alert.alert('Sucesso', 'Configurações restauradas com sucesso!');
            } catch (error) {
              console.error('Error resetting settings:', error);
              Alert.alert('Erro', 'Não foi possível restaurar as configurações.');
            }
          }
        }
      ]
    );
  };

  // Format last backup date
  const formatLastBackupDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* User Info */}
      {user && (
        <View style={[styles.userCard, { backgroundColor: theme.card }]}>
          <View style={[styles.userAvatar, { backgroundColor: theme.primary }]}>
            <Icon name="account" size={32} color="#fff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user.name || 'Usuário'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
              {user.email}
            </Text>
          </View>
        </View>
      )}

      {/* App Settings */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Configurações do Aplicativo
      </Text>
      
      <View style={[styles.settingsCard, { backgroundColor: theme.card }]}>
        {/* Dark Mode */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => toggleTheme()}
        >
          <View style={styles.settingInfo}>
            <Icon name="theme-light-dark" size={22} color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Tema Escuro
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Alterar aparência do aplicativo
              </Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={isDarkMode ? theme.primary : '#f4f3f4'}
          />
        </TouchableOpacity>
        
        {/* Hide Values */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => handleToggleHideValues(!hideValues)}
        >
          <View style={styles.settingInfo}>
            <Icon name="eye-off" size={22} color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Ocultar Valores
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Ocultar valores monetários na tela inicial
              </Text>
            </View>
          </View>
          <Switch
            value={hideValues}
            onValueChange={handleToggleHideValues}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={hideValues ? theme.primary : '#f4f3f4'}
          />
        </TouchableOpacity>
        
        {/* Notifications */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => handleToggleNotifications(!notificationsEnabled)}
        >
          <View style={styles.settingInfo}>
            <Icon name="bell" size={22} color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Notificações
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Receber lembretes e alertas
              </Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={notificationsEnabled ? theme.primary : '#f4f3f4'}
          />
        </TouchableOpacity>

        {/* Budget Alerts */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => handleToggleBudgetAlerts(!budgetAlerts)}
        >
          <View style={styles.settingInfo}>
            <Icon name="alert-circle" size={22} color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Alertas de Orçamento
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Avisos quando o orçamento estiver no limite
              </Text>
            </View>
          </View>
          <Switch
            value={budgetAlerts}
            onValueChange={handleToggleBudgetAlerts}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={budgetAlerts ? theme.primary : '#f4f3f4'}
          />
        </TouchableOpacity>
      </View>
      
      {/* Backup & Data */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Backup e Dados
      </Text>
      
      <View style={[styles.settingsCard, { backgroundColor: theme.card }]}>
        {/* Auto Backup */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => handleToggleAutoBackup(!autoBackup)}
        >
          <View style={styles.settingInfo}>
            <Icon name="backup-restore" size={22} color={theme.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Backup Automático
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Fazer backup automático dos dados diariamente
              </Text>
            </View>
          </View>
          <Switch
            value={autoBackup}
            onValueChange={handleToggleAutoBackup}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={autoBackup ? theme.primary : '#f4f3f4'}
          />
        </TouchableOpacity>

        {/* Last Backup Info */}
        <View style={styles.backupInfo}>
          <Text style={[styles.backupInfoText, { color: theme.textSecondary }]}>
            Último backup: {formatLastBackupDate(lastBackupDate)}
          </Text>
        </View>
        
        {/* Manual Backup */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleManualBackup}
          disabled={backupLoading}
        >
          <View style={styles.settingInfo}>
            <Icon name="content-save" size={22} color={theme.primary} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Fazer Backup Agora
            </Text>
          </View>
          {backupLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Icon name="chevron-right" size={22} color={theme.textSecondary} />
          )}
        </TouchableOpacity>
        
        {/* Import Backup */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleImportBackup}
        >
          <View style={styles.settingInfo}>
            <Icon name="restore" size={22} color={theme.primary} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Importar Backup
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* View Backup History */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleViewBackupHistory}
        >
          <View style={styles.settingInfo}>
            <Icon name="history" size={22} color={theme.primary} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Histórico de Backups
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
        
        {/* Reset Settings */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleResetSettings}
        >
          <View style={styles.settingInfo}>
            <Icon name="refresh" size={22} color={theme.primary} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Restaurar Configurações
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* About & Support */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Suporte e Informações
      </Text>
      
      <View style={[styles.settingsCard, { backgroundColor: theme.card }]}>
        {/* Help */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => {
            Alert.alert(
              'Ajuda',
              'Para dúvidas ou sugestões, entre em contato conosco pelo e-mail: suporte@financeapp.com'
            );
          }}
        >
          <View style={styles.settingInfo}>
            <Icon name="help-circle" size={22} color={theme.primary} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Ajuda e Suporte
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
        
        {/* About */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => {
            Alert.alert(
              'Sobre o Finance App',
              'Finance App é um aplicativo de gerenciamento de finanças pessoais para ajudar você a controlar suas despesas, receitas e metas financeiras.\n\nVersão: 1.0.0'
            );
          }}
        >
          <View style={styles.settingInfo}>
            <Icon name="information" size={22} color={theme.primary} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Sobre o Aplicativo
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity 
          style={[styles.settingRow, styles.logoutRow]}
          onPress={handleLogout}
        >
          <View style={styles.settingInfo}>
            <Icon name="logout" size={22} color={theme.error} />
            <Text style={[styles.settingLabel, { color: theme.error }]}>
              Sair da conta
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.textSecondary }]}>
          Versão 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 8,
  },
  settingsCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  backupInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backupInfoText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  logoutRow: {
    borderBottomWidth: 0,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  versionText: {
    fontSize: 14,
  },
});

export default Settings;