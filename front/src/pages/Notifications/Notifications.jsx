import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services';
import { Bell, Check, CheckCheck, Eye, Trash2, Filter } from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import { toast } from 'react-toastify';

const Notifications = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [actionLoading, setActionLoading] = useState({});

  // Load notifications
  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const [notifResult, countResult] = await Promise.all([
        notificationService.getNotifications({ page: 1, limit: 50 }),
        notificationService.getUnreadCount()
      ]);
      
      if (notifResult.success && notifResult.data.notifications) {
        const formatted = notifResult.data.notifications.map(n => 
          notificationService.formatNotification(n)
        );
        setNotifications(formatted);
      }
      
      if (countResult.success) {
        setUnreadCount(countResult.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);


  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    return 'Agora mesmo';
  };

  const getNotificationColor = (notification) => {
    if (notification.color) {
      const colors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        red: 'bg-red-100 text-red-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        purple: 'bg-purple-100 text-purple-600',
        gray: 'bg-gray-100 text-gray-600'
      };
      return colors[notification.color] || 'bg-blue-100 text-blue-600';
    }
    
    // Fallback to type-based colors
    switch (notification.type) {
      case 'question': return 'bg-blue-100 text-blue-600';
      case 'order': return 'bg-green-100 text-green-600';
      case 'favorite': return 'bg-red-100 text-red-600';
      case 'system': return 'bg-gray-100 text-gray-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    setActionLoading(prev => ({ ...prev, [notificationId]: true }));
    
    try {
      const result = await notificationService.markAsRead(notificationId);
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success('Notificação marcada como lida');
      } else {
        toast.error(result.message || 'Erro ao marcar como lida');
      }
    } catch (error) {
      toast.error('Erro ao marcar como lida');
    }
    
    setActionLoading(prev => ({ ...prev, [notificationId]: false }));
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('Todas as notificações foram marcadas como lidas');
      } else {
        toast.error(result.message || 'Erro ao marcar todas como lidas');
      }
    } catch (error) {
      toast.error('Erro ao marcar todas como lidas');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    setActionLoading(prev => ({ ...prev, [notificationId]: true }));
    
    try {
      const result = await notificationService.deleteNotification(notificationId);
      if (result.success) {
        const notification = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        
        // Update unread count if the deleted notification was unread
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        toast.success('Notificação removida');
      } else {
        toast.error(result.message || 'Erro ao remover notificação');
      }
    } catch (error) {
      toast.error('Erro ao remover notificação');
    }
    
    setActionLoading(prev => ({ ...prev, [notificationId]: false }));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const handleNotificationClick = (notification) => {
    // Handle navigation based on notification data
    if (notification.data) {
      const data = notification.data;
      if (data.ad_id) {
        navigate(`/ads/${data.ad_id}`);
      } else if (data.order_id) {
        navigate(`/orders/${data.order_id}`);
      } else if (data.question_id) {
        navigate(`/dashboard?tab=questions`);
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Acesso Restrito
          </h2>
          <p className="text-gray-600">
            Faça login para ver suas notificações
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Notificações
                </h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <Button onClick={handleMarkAllAsRead} disabled={loading}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Não lidas ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'read'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Lidas ({notifications.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg cursor-pointer ${
                  !notification.read ? 'border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-full ${getNotificationColor(notification)}`}>
                    <span className="text-lg">
                      {notification.icon || '🔔'}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}
                            disabled={actionLoading[notification._id]}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="Marcar como lida"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification._id);
                          }}
                          disabled={actionLoading[notification._id]}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Remover notificação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {notification.timeAgo || formatTime(notification.created_at)}
                      </span>
                      
                      {!notification.read && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Nova
                        </span>
                      )}
                      
                      {notification.isNew && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Recente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {filter === 'unread' ? 'Nenhuma notificação não lida' :
                 filter === 'read' ? 'Nenhuma notificação lida' :
                 'Nenhuma notificação'}
              </h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'Você não tem notificações ainda'
                  : 'Altere o filtro para ver outras notificações'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;