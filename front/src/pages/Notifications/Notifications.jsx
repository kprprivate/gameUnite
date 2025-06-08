import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Check, CheckCheck, Eye, Trash2, Filter } from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import { toast } from 'react-toastify';

const Notifications = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    setLoading(true);
    
    try {
      // Simular carregamento de notificações - implementar API depois
      const mockNotifications = [
        {
          id: 1,
          type: 'question',
          title: 'Nova pergunta no seu anúncio',
          message: 'João perguntou: "O jogo está funcionando perfeitamente?"',
          timestamp: new Date(Date.now() - 5 * 60000),
          read: false,
          data: {
            ad_id: '123',
            ad_title: 'Counter-Strike 2',
            user_name: 'João'
          }
        },
        {
          id: 2,
          type: 'order',
          title: 'Pedido entregue',
          message: 'Seu pedido "Valorant" foi marcado como entregue',
          timestamp: new Date(Date.now() - 2 * 60 * 60000),
          read: false,
          data: {
            order_id: '456',
            product_title: 'Valorant'
          }
        },
        {
          id: 3,
          type: 'favorite',
          title: 'Anúncio favoritado',
          message: 'Maria favoritou seu anúncio "League of Legends"',
          timestamp: new Date(Date.now() - 24 * 60 * 60000),
          read: true,
          data: {
            ad_id: '789',
            ad_title: 'League of Legends',
            user_name: 'Maria'
          }
        },
        {
          id: 4,
          type: 'system',
          title: 'Anúncio aprovado',
          message: 'Seu anúncio "Minecraft" foi aprovado e está visível',
          timestamp: new Date(Date.now() - 48 * 60 * 60000),
          read: true,
          data: {
            ad_id: '101',
            ad_title: 'Minecraft'
          }
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro ao carregar notificações');
    }
    
    setLoading(false);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    return 'Agora mesmo';
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'question': return '💬';
      case 'order': return '📦';
      case 'favorite': return '❤️';
      case 'system': return '🔔';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'question': return 'bg-blue-100 text-blue-600';
      case 'order': return 'bg-green-100 text-green-600';
      case 'favorite': return 'bg-red-100 text-red-600';
      case 'system': return 'bg-gray-100 text-gray-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  const markAsRead = async (notificationId) => {
    setActionLoading(prev => ({ ...prev, [notificationId]: true }));
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      toast.success('Notificação marcada como lida');
    } catch (error) {
      toast.error('Erro ao marcar como lida');
    }
    
    setActionLoading(prev => ({ ...prev, [notificationId]: false }));
  };

  const markAllAsRead = async () => {
    setLoading(true);
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      toast.error('Erro ao marcar todas como lidas');
    }
    
    setLoading(false);
  };

  const deleteNotification = async (notificationId) => {
    setActionLoading(prev => ({ ...prev, [notificationId]: true }));
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notificação removida');
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

  const unreadCount = notifications.filter(n => !n.read).length;

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
              <Button onClick={markAllAsRead} disabled={loading}>
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
                key={notification.id}
                className={`bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg ${
                  !notification.read ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-full ${getNotificationColor(notification.type)}`}>
                    <span className="text-lg">
                      {getNotificationIcon(notification.type)}
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
                            onClick={() => markAsRead(notification.id)}
                            disabled={actionLoading[notification.id]}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="Marcar como lida"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          disabled={actionLoading[notification.id]}
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
                        {formatTime(notification.timestamp)}
                      </span>
                      
                      {!notification.read && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Nova
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
                  : `Altere o filtro para ver outras notificações`
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