// front/src/services/userService.js
import api from './api';

export const userService = {
  async getProfile() {
    try {
      const response = await api.get('/users/profile');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar perfil'
      };
    }
  },

  async updateProfile(userData) {
    try {
      const response = await api.put('/users/profile', userData);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao atualizar perfil'
      };
    }
  },

  async changePassword(passwordData) {
    try {
      const response = await api.post('/users/change-password', passwordData);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao alterar senha'
      };
    }
  },

  async getDashboardData() {
    try {
      const response = await api.get('/users/dashboard');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar dados do dashboard'
      };
    }
  },

  async getUserPublicProfile(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar perfil público'
      };
    }
  }
};