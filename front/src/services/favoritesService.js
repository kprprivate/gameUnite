import api from './api';

export const favoritesService = {
  async getFavorites(params = {}) {
    try {
      const response = await api.get('/users/favorites', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar favoritos'
      };
    }
  },

  async addToFavorites(adId) {
    try {
      const response = await api.post(`/users/favorites/${adId}`);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao adicionar aos favoritos'
      };
    }
  },

  async removeFromFavorites(adId) {
    try {
      const response = await api.delete(`/users/favorites/${adId}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao remover dos favoritos'
      };
    }
  },

  async toggleFavorite(adId) {
    try {
      const response = await api.post(`/users/favorites/${adId}/toggle`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao alterar favorito'
      };
    }
  },

  async checkIsFavorite(adId) {
    try {
      const response = await api.get(`/users/favorites/${adId}/check`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao verificar favorito'
      };
    }
  }
};