import api from './api';

export const cartService = {
  // Buscar carrinho do usuário
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar carrinho:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar carrinho'
      };
    }
  },

  // Adicionar item ao carrinho
  addToCart: async (adId, quantity = 1) => {
    try {
      const response = await api.post('/cart/add', {
        ad_id: adId,
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao adicionar ao carrinho'
      };
    }
  },

  // Atualizar quantidade do item
  updateCartItem: async (adId, quantity) => {
    try {
      const response = await api.put(`/cart/update/${adId}`, {
        quantity
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao atualizar item'
      };
    }
  },

  // Remover item do carrinho
  removeFromCart: async (adId) => {
    try {
      const response = await api.delete(`/cart/remove/${adId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao remover item:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao remover item'
      };
    }
  },

  // Limpar carrinho
  clearCart: async () => {
    try {
      const response = await api.delete('/cart/clear');
      return response.data;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao limpar carrinho'
      };
    }
  },

  // Validar carrinho
  validateCart: async () => {
    try {
      const response = await api.get('/cart/validate');
      return response.data;
    } catch (error) {
      console.error('Erro ao validar carrinho:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao validar carrinho'
      };
    }
  },

  // Contar itens do carrinho
  getCartCount: async () => {
    try {
      const response = await api.get('/cart/count');
      return response.data;
    } catch (error) {
      console.error('Erro ao contar itens:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao contar itens'
      };
    }
  }
};