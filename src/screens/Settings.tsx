// src/screens/Settings.tsx (corrigido)
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { 
  getData, 
  saveUserSettings, 
  storeData, 
  STORAGE_KEYS, 
  UserSettings 
} from '../utils/storage';
import { DEFAULT_SETTINGS } from '../constants';

const Settings = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  
  // App settings
  const [hideValues, setHideValues] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  
  // Loading state
  const [loading, setLoading] = useState<boolean>(true);
  
  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load hide values preference
        const hideValuesPreference = await getData<boolean>(STORAGE_KEYS.HIDE_VALUES);
        if (hideValuesPreference !== null) {
          setHideValues(hideValuesPreference);
        }
        
        // Load user settings
        const userSettings = await getData<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
        if (userSettings !== null && userSettings.notificationsEnabled !== undefined) {
          setNotificationsEnabled(userSettings.notificationsEnabled);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
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
      await saveUserSettings({
        notificationsEnabled: value,
      });
    } catch (error) {
      console.error('Error saving notifications preference:', error);
    }
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
              // Reset settings
              await storeData(STORAGE_KEYS.HIDE_VALUES, DEFAULT_SETTINGS.hideValues);
              await saveUserSettings({
                notificationsEnabled: DEFAULT_SETTINGS.notificationsEnabled,
              });
              
              // Update state
              setHideValues(DEFAULT_SETTINGS.hideValues);
              setNotificationsEnabled(DEFAULT_SETTINGS.notificationsEnabled);
              
              Alert.alert(
                'Sucesso',
                'Configurações restauradas com sucesso!'
              );
            } catch (error) {
              console.error('Error resetting settings:', error);
              Alert.alert(
                'Erro',
                'Não foi possível restaurar as configurações. Tente novamente.'
              );
            }
          }
        }
      ]
    );
  };
  
  // Get app version from app.json
  const appVersion = '1.0.0'; // Hardcoded for now
  
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
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Tema Escuro
            </Text>
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
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Ocultar Valores
            </Text>
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
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Notificações
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#767577', true: theme.primary + '80' }}
            thumbColor={notificationsEnabled ? theme.primary : '#f4f3f4'}
          />
        </TouchableOpacity>
      </View>
      
      {/* Data Management */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Gerenciamento de Dados
      </Text>
      
      <View style={[styles.settingsCard, { backgroundColor: theme.card }]}>
        {/* Export Data (Would be implemented with an actual feature) */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => {
            Alert.alert(
              'Em Desenvolvimento',
              'Esta funcionalidade estará disponível em breve!'
            );
          }}
        >
          <View style={styles.settingInfo}>
            <Icon name="export" size={22} color={theme.primary} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Exportar Dados
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
        
        {/* Backup & Restore (Would be implemented with an actual feature) */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => {
            Alert.alert(
              'Em Desenvolvimento',
              'Esta funcionalidade estará disponível em breve!'
            );
          }}
        >
          <View style={styles.settingInfo}>
            <Icon name="backup-restore" size={22} color={theme.primary} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Backup e Restauração
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
      
      {/* About */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Sobre
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
        
        {/* Privacy Policy */}
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={() => {
            Alert.alert(
              'Em Desenvolvimento',
              'Esta funcionalidade estará disponível em breve!'
            );
          }}
        >
          <View style={styles.settingInfo}>
            <Icon name="shield" size={22} color={theme.primary} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Política de Privacidade
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
              'Finance App é um aplicativo de gerenciamento de finanças pessoais para ajudar você a controlar suas despesas, receitas e metas financeiras.\n\nVersão: ' + appVersion
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
      </View>
      
      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: theme.textSecondary }]}>
          Versão {appVersion}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
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