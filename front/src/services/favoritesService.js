import api from './api';

export const favoritesService = {
  async getFavorites(params = {}) {
    try {
      const response = await api.get('/favorites', { params });
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
      const response = await api.post(`/favorites/${adId}`);
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
      const response = await api.delete(`/favorites/${adId}`);
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
      const response = await api.post(`/favorites/${adId}/toggle`);
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

  // NOVA FUNÇÃO: Verificar se um anúncio está favoritado
  async checkIsFavorite(adId) {
    try {
      const response = await api.get(`/favorites/${adId}/check`);
      return { success: true, data: response.data.data };
    } catch (error) {
      // Se não conseguir verificar (ex: usuário não logado), retornar false
      if (error.response?.status === 401) {
        return { success: true, data: { is_favorited: false } };
      }

      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao verificar favorito'
      };
    }
  }
};