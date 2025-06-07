import api from './api';

export const orderService = {
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders', orderData);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao criar pedido'
      };
    }
  },

  // CORRIGIDO: Função renomeada para processCheckout
  async processCheckout(checkoutData) {
    try {
      const response = await api.post('/orders/checkout', checkoutData);
      return { success: true, data: response.data.data, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro no checkout'
      };
    }
  },

  // Mantendo a função original também para compatibilidade
  async checkout(checkoutData) {
    return this.processCheckout(checkoutData);
  },

  async getOrders(params = {}) {
    try {
      const response = await api.get('/orders', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar pedidos'
      };
    }
  },

  async getOrder(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar pedido'
      };
    }
  },

  async updateOrderStatus(orderId, status, role = null) {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status, role });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao atualizar status'
      };
    }
  },

  async getOrderStats() {
    try {
      const response = await api.get('/orders/stats');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar estatísticas'
      };
    }
  },

  async getSales(params = {}) {
    try {
      const response = await api.get('/orders/sales', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar vendas'
      };
    }
  },

  async getPurchases(params = {}) {
    try {
      const response = await api.get('/orders/purchases', { params });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar compras'
      };
    }
  }
};