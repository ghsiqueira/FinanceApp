// src/services/api.ts - Updated version
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Altere essa URL quando estiver em produção
const API_URL = __DEV__ 
  ? 'http://10.0.2.2:5000/api' // Endereço local para o emulador Android
  : 'https://financeapp-fi69.onrender.com/api'; // URL do servidor no Render

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@FinanceApp:authToken');
      if (token) {
        config.headers['x-auth-token'] = token;
        console.log('Added auth token to request');
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log error details
    if (error.response) {
      // The request was made and the server responded with a status code
      // outside the range of 2xx
      console.error('API Error Response:', error.response.status, error.response.data);
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        console.log('Token expired or invalid, should redirect to login');
        // You could handle token expiration here - redirecting to login, etc.
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;