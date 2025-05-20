// src/screens/VerifyResetCode.tsx
import React, { useState, useEffect } from 'react';
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
}

const VerifyResetCode = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { email } = (route.params as RouteParams) || {};
  
  const { theme } = useTheme();
  const { verifyResetCode } = useAuth();
  
  // Gerenciar os 5 dígitos separadamente para uma melhor experiência
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [code3, setCode3] = useState('');
  const [code4, setCode4] = useState('');
  const [code5, setCode5] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState(60); // Contador para reenvio do código
  const [canResend, setCanResend] = useState(false);
  
  // Referências para os inputs para facilitar a navegação
  const input1Ref = React.useRef<TextInput>(null);
  const input2Ref = React.useRef<TextInput>(null);
  const input3Ref = React.useRef<TextInput>(null);
  const input4Ref = React.useRef<TextInput>(null);
  const input5Ref = React.useRef<TextInput>(null);
  
  // Timer para controlar o reenvio do código
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [remainingTime]);
  
  // Combina os dígitos em um único código
  const getFullCode = () => {
    return `${code1}${code2}${code3}${code4}${code5}`;
  };
  
  // Verifica automaticamente o código quando todos os dígitos são preenchidos
  useEffect(() => {
    const fullCode = getFullCode();
    if (fullCode.length === 5) {
      verifyCode();
    }
  }, [code1, code2, code3, code4, code5]);
  
  // Verifica o código com o servidor
  const verifyCode = async () => {
    const fullCode = getFullCode();
    
    if (fullCode.length !== 5) {
      setError('Por favor, insira o código completo de 5 dígitos');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await verifyResetCode({ email, code: fullCode });
      
      // Navegar para a tela de redefinição de senha
      navigation.navigate('ResetPassword', { email, code: fullCode });
    } catch (error: any) {
      setError('Código inválido ou expirado. Tente novamente.');
      // Limpar os campos
      setCode1('');
      setCode2('');
      setCode3('');
      setCode4('');
      setCode5('');
      input1Ref.current?.focus();
    } finally {
      setLoading(false);
    }
  };
  
  // Solicitar reenvio do código
  const handleResendCode = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      // Usar a função de solicitar código do AuthContext
      await useAuth().requestReset({ email });
      
      // Resetar o timer
      setRemainingTime(60);
      setCanResend(false);
      
      Alert.alert(
        'Código Reenviado',
        'Um novo código de verificação foi enviado para o seu e-mail.'
      );
    } catch (error) {
      Alert.alert(
        'Erro',
        'Não foi possível reenviar o código. Tente novamente mais tarde.'
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
          <Text style={[styles.title, { color: theme.text }]}>Verificar Código</Text>
        </View>
        
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Insira o código de 5 dígitos enviado para {email}
        </Text>
        
        {/* Inputs para o código de 5 dígitos */}
        <View style={styles.codeContainer}>
          <TextInput
            ref={input1Ref}
            style={[
              styles.codeInput,
              { 
                borderColor: error ? theme.error : theme.border,
                backgroundColor: theme.card,
                color: theme.text
              }
            ]}
            value={code1}
            onChangeText={(value) => {
              setCode1(value);
              if (value.length === 1) input2Ref.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
          />
          <TextInput
            ref={input2Ref}
            style={[
              styles.codeInput,
              { 
                borderColor: error ? theme.error : theme.border,
                backgroundColor: theme.card,
                color: theme.text
              }
            ]}
            value={code2}
            onChangeText={(value) => {
              setCode2(value);
              if (value.length === 1) input3Ref.current?.focus();
              else if (value.length === 0) input1Ref.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
          />
          <TextInput
            ref={input3Ref}
            style={[
              styles.codeInput,
              { 
                borderColor: error ? theme.error : theme.border,
                backgroundColor: theme.card,
                color: theme.text
              }
            ]}
            value={code3}
            onChangeText={(value) => {
              setCode3(value);
              if (value.length === 1) input4Ref.current?.focus();
              else if (value.length === 0) input2Ref.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
          />
          <TextInput
            ref={input4Ref}
            style={[
              styles.codeInput,
              { 
                borderColor: error ? theme.error : theme.border,
                backgroundColor: theme.card,
                color: theme.text
              }
            ]}
            value={code4}
            onChangeText={(value) => {
              setCode4(value);
              if (value.length === 1) input5Ref.current?.focus();
              else if (value.length === 0) input3Ref.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
          />
          <TextInput
            ref={input5Ref}
            style={[
              styles.codeInput,
              { 
                borderColor: error ? theme.error : theme.border,
                backgroundColor: theme.card,
                color: theme.text
              }
            ]}
            value={code5}
            onChangeText={(value) => {
              setCode5(value);
              if (value.length === 0) input4Ref.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={1}
          />
        </View>
        
        {error ? (
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error}
          </Text>
        ) : null}
        
        {/* Botão para verificar manualmente (opcional, pois já verifica automaticamente) */}
        <TouchableOpacity
          style={[styles.verifyButton, { backgroundColor: theme.primary }]}
          onPress={verifyCode}
          disabled={loading || getFullCode().length !== 5}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.verifyButtonText}>Verificar Código</Text>
          )}
        </TouchableOpacity>
        
        {/* Opção de reenvio */}
        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: theme.textSecondary }]}>
            Não recebeu o código?
          </Text>
          {canResend ? (
            <TouchableOpacity 
              onPress={handleResendCode}
              disabled={loading}
            >
              <Text style={[styles.resendButton, { color: theme.primary }]}>
                Reenviar código
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.timerText, { color: theme.textSecondary }]}>
              Reenviar em {remainingTime}s
            </Text>
          )}
        </View>
        
        {/* Botão para voltar ao login */}
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  verifyButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    marginRight: 4,
  },
  resendButton: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 14,
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

export default VerifyResetCode;