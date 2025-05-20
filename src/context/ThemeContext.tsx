// src/context/ThemeContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from '../utils/colors';
import { getTheme, saveTheme } from '../utils/storage';

interface ThemeContextData {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    card: string;
    border: string;
    primary: string;
    secondary: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceTheme = useColorScheme(); // Recebe o tema do dispositivo
  const [isDarkMode, setIsDarkMode] = useState(deviceTheme === 'dark');

  // Carregar tema salvo
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await getTheme();
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme.isDarkMode);
        } else {
          // Se não tiver tema salvo, usa o do dispositivo
          setIsDarkMode(deviceTheme === 'dark');
        }
      } catch (error) {
        console.log('Erro ao carregar tema:', error);
      }
    };

    loadTheme();
  }, [deviceTheme]);

  // Alternar tema (claro/escuro)
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    saveTheme(!isDarkMode);
  };

  // Definir cores com base no tema
  const theme = {
    background: isDarkMode ? '#121212' : colors.background,
    surface: isDarkMode ? '#1e1e1e' : colors.surface,
    text: isDarkMode ? '#ffffff' : colors.textPrimary,
    textSecondary: isDarkMode ? '#b3b3b3' : colors.textSecondary,
    card: isDarkMode ? '#2c2c2c' : colors.surface,
    border: isDarkMode ? '#3a3a3a' : '#e0e0e0',
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);