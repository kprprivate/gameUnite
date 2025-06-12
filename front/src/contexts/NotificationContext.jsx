import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Fetch notifications
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const result = await notificationService.getNotifications({
        page: 1,
        limit: 50,
        ...params
      });
      
      if (result.success) {
        const formattedNotifications = result.data.notifications?.map(
          notification => notificationService.formatNotification(notification)
        ) || [];
        
        setNotifications(formattedNotifications);
        setLastFetch(new Date());
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const result = await notificationService.getUnreadCount();
      if (result.success) {
        setUnreadCount(result.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        return { success: true };
      }
      return result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, message: 'Erro ao marcar como lida' };
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const result = await notificationService.markAllAsRead();
      if (result.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
        return { success: true };
      }
      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, message: 'Erro ao marcar todas como lidas' };
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const result = await notificationService.deleteNotification(notificationId);
      if (result.success) {
        const notification = notifications.find(n => n._id === notificationId);
        
        setNotifications(prev => 
          prev.filter(notification => notification._id !== notificationId)
        );
        
        // Update unread count if the deleted notification was unread
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        return { success: true };
      }
      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, message: 'Erro ao deletar notificação' };
    }
  }, [notifications]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    const formattedNotification = notificationService.formatNotification(notification);
    
    setNotifications(prev => [formattedNotification, ...prev]);
    
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Get recent notifications for dropdown
  const getRecentNotifications = useCallback((limit = 5) => {
    return notifications.slice(0, limit);
  }, [notifications]);

  // Refresh notifications (force refetch)
  const refreshNotifications = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Simplified: Load notifications only when needed
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Only fetch unread count periodically (every 2 minutes)
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  const value = {
    // State
    notifications,
    unreadCount,
    loading,
    
    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    refreshNotifications,
    
    // Helpers
    getRecentNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};