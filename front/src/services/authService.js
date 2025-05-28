import api from './api';
import Cookies from 'js-cookie';

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data.data;
      
      // Armazenar tokens
      Cookies.set('access_token', access_token, { expires: 1 }); // 1 dia
      Cookies.set('refresh_token', refresh_token, { expires: 7 }); // 7 dias
      
      return { success: true, user, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao fazer login'
      };
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, user: response.data.data.user, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao registrar usuário'
      };
    }
  },

  logout() {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
    window.location.href = '/login';
  },

  isAuthenticated() {
    return !!Cookies.get('access_token');
  },

  async requestPasswordReset(email) {
    try {
      const response = await api.post('/auth/password/reset-request', { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao solicitar reset de senha'
      };
    }
  },

  async resetPassword(token, password) {
    try {
      const response = await api.post('/auth/password/reset', { token, password });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao redefinir senha'
      };
    }
  }
};