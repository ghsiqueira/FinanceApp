// src/screens/LoadingScreen.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const LoadingScreen = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Icon name="wallet" size={80} color={theme.primary} style={styles.icon} />
      <Text style={[styles.appName, { color: theme.text }]}>Finance App</Text>
      <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});

export default LoadingScreen;