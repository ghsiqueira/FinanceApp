// src/screens/ForgotPassword.tsx
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
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { requestReset } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Validar email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleRequestReset = async () => {
    // Validar email
    if (!email) {
      setError('Por favor, informe seu e-mail');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('E-mail inválido');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await requestReset({ email });
      
      // Mostrar mensagem de sucesso
      Alert.alert(
        'Recuperação de senha',
        'Enviamos instruções para recuperar sua senha no e-mail informado.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      setError('Não foi possível enviar o e-mail de recuperação. Tente novamente.');
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
          <Text style={[styles.title, { color: theme.text }]}>Recuperar Senha</Text>
        </View>
        
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Informe o e-mail associado à sua conta para receber instruções de recuperação de senha.
        </Text>
        
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>E-mail</Text>
          <View style={[
            styles.inputWrapper, 
            { borderColor: error ? theme.error : theme.border, backgroundColor: theme.card }
          ]}>
            <Icon name="email-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Seu e-mail"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {error ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {error}
            </Text>
          ) : null}
        </View>
        
        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }]}
          onPress={handleRequestReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Enviar</Text>
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
    marginBottom: 24,
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
  // Continuação do arquivo src/screens/ForgotPassword.tsx
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

export default ForgotPassword;