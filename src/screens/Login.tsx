// src/screens/Login.tsx - Add automatic category initialization
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoryContext';

const Login = () => {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const { initializeDefaultCategories } = useCategories();
  
  // Estados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Validação do formulário
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  
  // Validar email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Validar formulário
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: ''
    };
    
    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
      valid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'E-mail inválido';
      valid = false;
    }
    
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  // Função de login
  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Chama a função de login do contexto de autenticação
      await signIn({ email, password });
      
      // Initialize default categories if needed
      try {
        await initializeDefaultCategories();
      } catch (categoriesError) {
        console.error('Error initializing categories:', categoriesError);
        // Continue anyway, this is not a blocking issue
      }
      
      // Não é necessário navegar, pois o estado signed no contexto já fará isso
    } catch (error: any) {
      // Mostrar mensagem de erro
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Não foi possível fazer login. Verifique suas credenciais e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Navegar para a tela de registro
  const navigateToRegister = () => {
    navigation.navigate('Register');
  };
  
  // Navegar para a tela de recuperação de senha
  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };
  
  // Rest of the component remains the same...
  // (Omitting the rest of the component for brevity)

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Icon name="wallet" size={80} color={theme.primary} />
          <Text style={[styles.appName, { color: theme.text }]}>Finance App</Text>
        </View>
        
        <Text style={[styles.title, { color: theme.text }]}>Login</Text>
        
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>E-mail</Text>
          <View style={[
            styles.inputWrapper, 
            { borderColor: errors.email ? theme.error : theme.border, backgroundColor: theme.card }
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
          {errors.email ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.email}
            </Text>
          ) : null}
        </View>
        
        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Senha</Text>
          <View style={[
            styles.inputWrapper, 
            { borderColor: errors.password ? theme.error : theme.border, backgroundColor: theme.card }
          ]}>
            <Icon name="lock-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Sua senha"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
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
          {errors.password ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.password}
            </Text>
          ) : null}
        </View>
        
        {/* Forgot Password Link */}
        <TouchableOpacity 
          style={styles.forgotPasswordContainer}
          onPress={navigateToForgotPassword}
        >
          <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
            Esqueceu sua senha?
          </Text>
        </TouchableOpacity>
        
        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: theme.primary }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>
        
        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={[styles.registerText, { color: theme.textSecondary }]}>
            Não tem uma conta?
          </Text>
          <TouchableOpacity onPress={navigateToRegister}>
            <Text style={[styles.registerLink, { color: theme.primary }]}>
              Registre-se
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
    marginRight: 4,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default Login;