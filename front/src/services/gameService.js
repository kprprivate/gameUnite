import api from './api';

export const gameService = {
  async getGames(params = {}) {
    try {
      const response = await api.get('/games', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar jogos'
      };
    }
  },

  async getGame(gameId) {
    try {
      const response = await api.get(`/games/${gameId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar jogo'
      };
    }
  },

  async getFeaturedGames() {
    try {
      const response = await api.get('/games/featured');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar jogos em destaque'
      };
    }
  }
};