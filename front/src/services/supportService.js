import api from './api';

export const supportService = {
  // Tickets
  async createTicket(data) {
    try {
      const response = await api.post('/support/tickets', data);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Ticket criado com sucesso'
      };
    } catch (error) {
      console.error('❌ Error creating ticket:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao criar ticket'
      };
    }
  },

  async getUserTickets(params = {}) {
    try {
      const response = await api.get('/support/tickets', { params });
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Tickets carregados com sucesso'
      };
    } catch (error) {
      console.error('❌ Error fetching tickets:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao carregar tickets',
        data: { tickets: [] }
      };
    }
  },

  async getTicketByProtocol(protocolNumber) {
    try {
      const response = await api.get(`/support/tickets/protocol/${protocolNumber}`);
      
      return {
        success: true,
        data: response.data,
        message: 'Ticket encontrado'
      };
    } catch (error) {
      console.error('❌ Error finding ticket:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Ticket não encontrado'
      };
    }
  },

  async getTicketById(ticketId) {
    try {
      const response = await api.get(`/support/tickets/${ticketId}`);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Ticket encontrado'
      };
    } catch (error) {
      console.error('❌ Error fetching ticket:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Ticket não encontrado'
      };
    }
  },

  async addTicketReply(ticketId, message) {
    try {
      const response = await api.post(`/support/tickets/${ticketId}/reply`, { message });
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: 'Mensagem adicionada com sucesso'
      };
    } catch (error) {
      console.error('❌ Error adding reply:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao adicionar mensagem'
      };
    }
  },

  async updateTicketStatus(ticketId, status) {
    try {
      const response = await api.patch(`/support/tickets/${ticketId}/status`, { status });
      
      return {
        success: true,
        data: response.data,
        message: 'Status atualizado com sucesso'
      };
    } catch (error) {
      console.error('❌ Error updating ticket status:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao atualizar status'
      };
    }
  },
  
  // Admin - Tickets
  async getAllTickets(params = {}) {
    try {
      const response = await api.get('/support/admin/tickets', { params });
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Tickets carregados com sucesso'
      };
    } catch (error) {
      console.error('❌ Error fetching admin tickets:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao carregar tickets',
        data: { tickets: [] }
      };
    }
  },

  async updateTicket(ticketId, data) {
    try {
      const response = await api.put(`/support/admin/tickets/${ticketId}`, data);
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Ticket atualizado com sucesso'
      };
    } catch (error) {
      console.error('❌ Error updating admin ticket:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao atualizar ticket'
      };
    }
  },
  
  // Admin - Games
  createGame: (data) => api.post('/support/admin/games', data),
  updateGame: (gameId, data) => api.put(`/support/admin/games/${gameId}`, data),
  deleteGame: (gameId) => api.delete(`/support/admin/games/${gameId}`),
  
  // Admin - Categories
  getCategories: () => api.get('/support/admin/categories'),
  createCategory: (data) => api.post('/support/admin/categories', data),
  updateCategory: (categoryId, data) => api.put(`/support/admin/categories/${categoryId}`, data),
  deleteCategory: (categoryId) => api.delete(`/support/admin/categories/${categoryId}`),
  
  // Ratings
  submitRating: (orderId, data) => api.post(`/support/ratings/${orderId}`, data),
  
  // Admin Stats
  async getAdminStats() {
    try {
      const response = await api.get('/support/admin/stats');
      
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Estatísticas carregadas com sucesso'
      };
    } catch (error) {
      console.error('❌ Error fetching admin stats:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erro ao carregar estatísticas',
        data: {}
      };
    }
  },

  // Validation helpers
  validateTicketData(data) {
    const errors = [];
    
    if (!data.subject || data.subject.trim().length < 5) {
      errors.push('Assunto deve ter pelo menos 5 caracteres');
    }
    
    if (!data.message || data.message.trim().length < 10) {
      errors.push('Mensagem deve ter pelo menos 10 caracteres');
    }
    
    if (!['general', 'technical', 'billing', 'account'].includes(data.category)) {
      errors.push('Categoria inválida');
    }
    
    if (!['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
      errors.push('Prioridade inválida');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: {
        subject: data.subject?.trim(),
        message: data.message?.trim(),
        category: data.category,
        priority: data.priority
      }
    };
  }
};

export default supportService;