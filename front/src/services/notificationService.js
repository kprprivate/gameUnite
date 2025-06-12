import api from './api';

class NotificationService {
  // Get user notifications with pagination and filtering
  async getNotifications(params = {}) {
    try {
      const response = await api.get('/notifications/', { params });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar notificações'
      };
    }
  }

  // Get unread notifications count
  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar contador',
        data: { unread_count: 0 }
      };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao marcar como lida'
      };
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/read-all');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao marcar todas como lidas'
      };
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao deletar notificação'
      };
    }
  }

  // Create a report
  async createReport(reportData) {
    try {
      const response = await api.post('/notifications/reports', reportData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating report:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao criar report'
      };
    }
  }

  // Get notification icon based on type
  getNotificationIcon(type) {
    const icons = {
      question: '❓',
      order: '📦',
      favorite: '❤️',
      system: '🔔',
      report: '⚠️',
      payment: '💳',
      message: '💬'
    };
    return icons[type] || '🔔';
  }

  // Get notification color based on type
  getNotificationColor(type) {
    const colors = {
      question: 'blue',
      order: 'green',
      favorite: 'red',
      system: 'gray',
      report: 'yellow',
      payment: 'purple',
      message: 'indigo'
    };
    return colors[type] || 'gray';
  }

  // Format notification for display
  formatNotification(notification) {
    return {
      ...notification,
      icon: this.getNotificationIcon(notification.type),
      color: this.getNotificationColor(notification.type),
      timeAgo: this.getTimeAgo(notification.created_at),
      isNew: !notification.read && this.isRecent(notification.created_at)
    };
  }

  // Get time ago string
  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'agora';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m atrás`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h atrás`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  }

  // Check if notification is recent (less than 5 minutes)
  isRecent(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    return diffInMinutes < 5;
  }
}

export const notificationService = new NotificationService();