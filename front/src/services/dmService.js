import api from './api';

export const dmService = {
  // Verificar status do chat (se está habilitado pelos admins)
  async getChatStatus() {
    try {
      const response = await api.get('/chat/status');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao verificar status do chat'
      };
    }
  },

  // Listar conversas do usuário
  async getConversations() {
    try {
      const response = await api.get('/chat/conversations');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao carregar conversas'
      };
    }
  },

  // Obter mensagens de uma conversa
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { page, limit }
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao carregar mensagens'
      };
    }
  },

  // Iniciar nova conversa
  async startConversation(data) {
    try {
      const response = await api.post('/chat/conversations', data);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao iniciar conversa'
      };
    }
  },

  // Enviar mensagem
  async sendMessage(conversationId, messageData) {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, messageData);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao enviar mensagem'
      };
    }
  },

  // Marcar mensagens como lidas
  async markAsRead(conversationId) {
    try {
      const response = await api.put(`/chat/conversations/${conversationId}/read`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao marcar como lida'
      };
    }
  },

  // Excluir conversa
  async deleteConversation(conversationId) {
    try {
      const response = await api.delete(`/chat/conversations/${conversationId}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao excluir conversa'
      };
    }
  },

  // Admin: Habilitar/Desabilitar chat globalmente
  async toggleChatStatus(enabled) {
    try {
      const response = await api.put('/admin/chat/status', { enabled });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao alterar status do chat'
      };
    }
  },

  // Admin: Acessar conversa de pedido reportado
  async getOrderConversation(orderId) {
    try {
      const response = await api.get(`/admin/orders/${orderId}/conversation`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao acessar conversa do pedido'
      };
    }
  },

  // Admin: Listar todas as conversas (para moderação)
  async getAllConversations(page = 1, limit = 20) {
    try {
      const response = await api.get('/admin/chat/conversations', {
        params: { page, limit }
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao carregar conversas'
      };
    }
  }
};