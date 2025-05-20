// src/screens/ResetPassword.tsx - Atualizado para usar código de 5 dígitos
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface RouteParams {
  email: string;
  code: string;
}

const ResetPassword = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { email, code } = (route.params as RouteParams) || {};
  
  const { theme } = useTheme();
  const { resetPassword } = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  // Validar formulário
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      newPassword: '',
      confirmPassword: ''
    };
    
    if (!newPassword) {
      newErrors.newPassword = 'A nova senha é obrigatória';
      valid = false;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'A senha deve ter pelo menos 6 caracteres';
      valid = false;
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme a nova senha';
      valid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Agora passamos email e código em vez de token
      await resetPassword({ email, code, newPassword });
      
      // Mostrar mensagem de sucesso
      Alert.alert(
        'Sucesso',
        'Sua senha foi redefinida com sucesso. Você já pode fazer login com a nova senha.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível redefinir sua senha. O código pode ser inválido ou ter expirado.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Redefinir Senha</Text>
        </View>
        
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Crie uma nova senha para sua conta.
        </Text>
        
        {/* New Password Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Nova Senha</Text>
          <View style={[
            styles.inputWrapper, 
            { borderColor: errors.newPassword ? theme.error : theme.border, backgroundColor: theme.card }
          ]}>
            <Icon name="lock-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Digite sua nova senha"
              placeholderTextColor={theme.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.visibilityIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Icon 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          {errors.newPassword ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.newPassword}
            </Text>
          ) : null}
        </View>
        
        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Confirmar Senha</Text>
          <View style={[
            styles.inputWrapper, 
            { borderColor: errors.confirmPassword ? theme.error : theme.border, backgroundColor: theme.card }
          ]}>
            <Icon name="lock-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Confirme sua nova senha"
              placeholderTextColor={theme.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.visibilityIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Icon 
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color={theme.textSecondary} 
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.confirmPassword}
            </Text>
          ) : null}
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Redefinir Senha</Text>
          )}
        </TouchableOpacity>
        
        {/* Return to Login */}
        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.loginLinkText, { color: theme.primary }]}>
            Voltar para o login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  visibilityIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
  },
});

export default ResetPassword;