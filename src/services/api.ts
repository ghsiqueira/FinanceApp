// src/services/api.ts
import axios from 'axios';

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

export default api;