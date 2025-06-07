// src/store/slices/themeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ThemeState {
  isDark: boolean;
  currentTheme: 'light' | 'dark';
  systemTheme: boolean; // Seguir tema do sistema
  primaryColor: string;
  accentColor: string;
  isLoading: boolean;
}

const initialState: ThemeState = {
  isDark: false,
  currentTheme: 'light',
  systemTheme: false,
  primaryColor: '#6C63FF',
  accentColor: '#10B981',
  isLoading: false
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // 🌙 Alternar entre tema claro e escuro
    toggleTheme: (state) => {
      state.isDark = !state.isDark;
      state.currentTheme = state.isDark ? 'dark' : 'light';
      state.systemTheme = false; // Desativar tema do sistema ao alternar manualmente
    },

    // 🎨 Definir tema específico
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.currentTheme = action.payload;
      state.isDark = action.payload === 'dark';
      state.systemTheme = false;
    },

    // 📱 Ativar/desativar tema do sistema
    setSystemTheme: (state, action: PayloadAction<boolean>) => {
      state.systemTheme = action.payload;
    },

    // 🎨 Definir cor primária
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
    },

    // ✨ Definir cor de destaque
    setAccentColor: (state, action: PayloadAction<string>) => {
      state.accentColor = action.payload;
    },

    // 🔄 Aplicar tema do sistema
    applySystemTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      if (state.systemTheme) {
        state.currentTheme = action.payload;
        state.isDark = action.payload === 'dark';
      }
    },

    // 💾 Carregar configurações do tema
    loadThemeFromStorage: (state, action: PayloadAction<Partial<ThemeState>>) => {
      return {
        ...state,
        ...action.payload,
        isLoading: false
      };
    },

    // 🔄 Estado de carregamento
    setThemeLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // 🎨 Resetar tema para padrão
    resetTheme: (state) => {
      return {
        ...initialState,
        isLoading: false
      };
    },

    // 🌈 Definir esquema de cores personalizado
    setCustomColorScheme: (state, action: PayloadAction<{
      primary: string;
      accent: string;
      theme?: 'light' | 'dark';
    }>) => {
      state.primaryColor = action.payload.primary;
      state.accentColor = action.payload.accent;
      if (action.payload.theme) {
        state.currentTheme = action.payload.theme;
        state.isDark = action.payload.theme === 'dark';
      }
    }
  }
});

// 🎯 Seletores
export const selectTheme = (state: { theme: ThemeState }) => state.theme;
export const selectIsDark = (state: { theme: ThemeState }) => state.theme.isDark;
export const selectCurrentTheme = (state: { theme: ThemeState }) => state.theme.currentTheme;
export const selectPrimaryColor = (state: { theme: ThemeState }) => state.theme.primaryColor;
export const selectAccentColor = (state: { theme: ThemeState }) => state.theme.accentColor;
export const selectSystemTheme = (state: { theme: ThemeState }) => state.theme.systemTheme;
export const selectThemeLoading = (state: { theme: ThemeState }) => state.theme.isLoading;

// 🎨 Seletor para cores do tema atual
export const selectThemeColors = (state: { theme: ThemeState }) => {
  const { isDark, primaryColor, accentColor } = state.theme;
  
  if (isDark) {
    return {
      background: '#121212',
      surface: '#1E1E1E',
      card: '#2D2D2D',
      text: '#FFFFFF',
      textSecondary: '#B3B3B3',
      border: '#333333',
      primary: primaryColor,
      accent: accentColor,
      error: '#FF5252',
      warning: '#FFC107',
      success: '#4CAF50',
      info: '#2196F3'
    };
  }

  return {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    card: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    primary: primaryColor,
    accent: accentColor,
    error: '#F44336',
    warning: '#FF9800',
    success: '#4CAF50',
    info: '#2196F3'
  };
};

export const {
  toggleTheme,
  setTheme,
  setSystemTheme,
  setPrimaryColor,
  setAccentColor,
  applySystemTheme,
  loadThemeFromStorage,
  setThemeLoading,
  resetTheme,
  setCustomColorScheme
} = themeSlice.actions;

export default themeSlice.reducer;