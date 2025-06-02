// front/src/services/adService.js
import api from './api';

export const adService = {
  async getAds(params = {}) {
    try {
      const response = await api.get('/ads', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar anúncios'
      };
    }
  },

  async getBoostedAds(params = {}) {
    try {
      const response = await api.get('/ads/boosted', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar anúncios em destaque'
      };
    }
  },

  async getAd(adId) {
    try {
      const response = await api.get(`/ads/${adId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar anúncio'
      };
    }
  },

  async createAd(adData) {
    try {
      const response = await api.post('/ads', adData);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao criar anúncio'
      };
    }
  },

  async updateAd(adId, adData) {
    try {
      const response = await api.put(`/ads/${adId}`, adData);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao atualizar anúncio'
      };
    }
  },

  async deleteAd(adId) {
    try {
      const response = await api.delete(`/ads/${adId}`);
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao deletar anúncio'
      };
    }
  },

  async getMyAds(params = {}) {
    try {
      const response = await api.get('/ads/my-ads', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar seus anúncios'
      };
    }
  },

  async getUserAds(userId, params = {}) {
    try {
      const response = await api.get(`/ads/user/${userId}`, { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar anúncios do usuário'
      };
    }
  },

  // Novas funções para curtir
  async likeAd(adId) {
    try {
      const response = await api.post(`/ads/${adId}/like`);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao curtir anúncio'
      };
    }
  },

  async getAdLikes(adId) {
    try {
      const response = await api.get(`/ads/${adId}/likes`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar curtidas'
      };
    }
  },

  // Função para buscar anúncio para edição
  async getAdForEdit(adId) {
    try {
      const response = await api.get(`/ads/${adId}/edit`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar anúncio para edição'
      };
    }
  }
};