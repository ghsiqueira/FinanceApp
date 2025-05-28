import api from './api';
import { AuthData } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthData> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(name: string, email: string, password: string): Promise<AuthData> {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  }
};