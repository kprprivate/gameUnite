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
  }
};