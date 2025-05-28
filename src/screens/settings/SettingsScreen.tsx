import React from 'react';
import { View, ScrollView, StyleSheet, Switch, Alert, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemedView, ThemedText, ThemedCard, ThemedButton } from '../../components/ThemedComponents';

const SettingsScreen = () => {
  const { user, signOut } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const handleSignOut = () => {
    Alert.alert(
      'Sair',
      'Deseja realmente sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: signOut, style: 'destructive' }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    rightElement, 
    onPress 
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
  }) => {
    const cardStyle: ViewStyle = {
      padding: 0,
      marginBottom: theme.spacing.sm,
    };

    const iconStyle: ViewStyle = {
      backgroundColor: `${theme.colors.primary}15`,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    };

    return (
      <ThemedCard style={cardStyle}>
        <View style={styles.settingContent}>
          <View style={styles.settingLeft}>
            <View style={iconStyle}>
              <Ionicons name={icon} size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.settingText}>
              <ThemedText variant="body" color="text">{title}</ThemedText>
              {subtitle && (
                <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                  {subtitle}
                </ThemedText>
              )}
            </View>
          </View>
          {rightElement}
        </View>
      </ThemedCard>
    );
  };

  const headerStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.border,
  };

  const avatarStyle: ViewStyle = {
    backgroundColor: theme.colors.primary,
  };

  const outlineButtonStyle: ViewStyle = {
    borderColor: theme.colors.error,
  };

  return (
    <ThemedView level="background" style={styles.container}>
      <View style={[styles.header, headerStyle]}>
        <ThemedText variant="title" color="text">Configurações</ThemedText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Perfil */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" color="textSecondary" style={styles.sectionTitle}>
            PERFIL
          </ThemedText>
          
          <ThemedCard style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={[styles.avatar, avatarStyle]}>
                <ThemedText variant="title" color="text" style={{ color: '#FFFFFF' }}>
                  {user?.name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <View style={styles.profileInfo}>
                <ThemedText variant="subtitle" color="text">{user?.name}</ThemedText>
                <ThemedText variant="body" color="textSecondary">{user?.email}</ThemedText>
              </View>
            </View>
          </ThemedCard>
        </View>

        {/* Aparência */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" color="textSecondary" style={styles.sectionTitle}>
            APARÊNCIA
          </ThemedText>
          
          <SettingItem
            icon="moon"
            title="Modo Escuro"
            subtitle={isDark ? 'Ativado' : 'Desativado'}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            }
          />
        </View>

        {/* Dados */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" color="textSecondary" style={styles.sectionTitle}>
            DADOS
          </ThemedText>
          
          <SettingItem
            icon="download"
            title="Exportar Dados"
            subtitle="Baixar seus dados em CSV"
            rightElement={
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            }
          />
          
          <SettingItem
            icon="cloud-upload"
            title="Backup"
            subtitle="Sincronizar com a nuvem"
            rightElement={
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            }
          />
        </View>

        {/* Sobre */}
        <View style={styles.section}>
          <ThemedText variant="subtitle" color="textSecondary" style={styles.sectionTitle}>
            SOBRE
          </ThemedText>
          
          <SettingItem
            icon="information-circle"
            title="Versão"
            subtitle="1.0.0"
          />
          
          <SettingItem
            icon="help-circle"
            title="Ajuda e Suporte"
            rightElement={
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            }
          />
        </View>

        {/* Sair */}
        <View style={styles.section}>
          <ThemedButton
            title="Sair da Conta"
            onPress={handleSignOut}
            variant="outline"
            icon="log-out"
            style={outlineButtonStyle}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  profileCard: {
    padding: 20,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
});

export default SettingsScreen;