import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { storageService } from '../../services/storage';
import { User, LoginCredentials, RegisterCredentials } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await apiService.auth.login(credentials);
      
      if (response.success && response.data) {
        // Salvar no storage local
        await storageService.saveAuth(response.data.user, response.data.token);
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Erro no login');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro no login';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const response = await apiService.auth.register(credentials);
      
      if (response.success && response.data) {
        await storageService.saveAuth(response.data.user, response.data.token);
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Erro no cadastro');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro no cadastro';
      return rejectWithValue(message);
    }
  }
);

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      const authData = await storageService.getAuth();
      
      if (!authData) {
        return rejectWithValue('Nenhum token encontrado');
      }

      const response = await apiService.auth.verifyToken();
      
      if (response.success && response.data) {
        return { user: response.data.user, token: authData.token };
      } else {
        await storageService.clearAuth();
        return rejectWithValue('Token inválido');
      }
    } catch (error: any) {
      await storageService.clearAuth();
      return rejectWithValue('Token inválido');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await storageService.clearAuth();
      await storageService.clear(); // Limpar todos os dados locais
      return true;
    } catch (error: any) {
      return rejectWithValue('Erro ao fazer logout');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await apiService.user.updateProfile(userData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Erro ao atualizar perfil');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Erro ao atualizar perfil';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      
      // Verify Token
      .addCase(verifyToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      
      // Update Profile
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
