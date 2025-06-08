import api from './api';

export const reportsService = {
  // Create a new report
  createReport: async (reportData) => {
    try {
      const response = await api.post('/reports/create', reportData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error creating report:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao criar report'
      };
    }
  },

  // Get all reports (admin only)
  getReports: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.reason) params.append('reason', filters.reason);
      
      const response = await api.get(`/reports?${params.toString()}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching reports:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar reports'
      };
    }
  },

  // Get specific report (admin only)
  getReport: async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching report:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar report'
      };
    }
  },

  // Update report status (admin only)
  updateReportStatus: async (reportId, status, adminNotes = null) => {
    try {
      const data = { status };
      if (adminNotes) {
        data.admin_notes = adminNotes;
      }
      
      const response = await api.put(`/reports/${reportId}/status`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error updating report status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao atualizar status do report'
      };
    }
  },

  // Get report statistics (admin only)
  getReportStatistics: async () => {
    try {
      const response = await api.get('/reports/statistics');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching report statistics:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar estatísticas'
      };
    }
  }
};

export default reportsService;