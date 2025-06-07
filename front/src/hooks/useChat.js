import { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

export const useChat = () => {
  const { user, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef(null);
  const pingIntervalRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      initializeChat();
      loadChatRooms();
      startPingInterval();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated]);

  const initializeChat = () => {
    const token = Cookies.get('access_token') || localStorage.getItem('access_token');

    if (token) {
      const socket = chatService.connect(token);
      if (socket) {
        socketRef.current = socket;
        setupSocketListeners(socket);
      }
    }
  };

  const setupSocketListeners = (socket) => {
    socket.on('connected', (data) => {
      setConnected(true);
      console.log('Chat autenticado:', data);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('room_joined', (data) => {
      console.log('Sala joined:', data);
      if (data.messages) {
        setMessages(data.messages);
      }
    });

    socket.on('new_message', (data) => {
      const message = data.message;

      // Atualizar mensagens se for a sala atual
      if (currentRoom && message.room_id === currentRoom._id) {
        setMessages(prev => [...prev, message]);
      }

      // Incrementar contador de não lidas
      if (message.user_id !== user?._id) {
        setUnreadCount(prev => prev + 1);

        // Mostrar notificação
        showNotification('Nova mensagem', message.content);
      }

      // Atualizar lista de salas
      loadChatRooms();
    });

    socket.on('user_typing', (data) => {
      if (data.user_id !== user?._id) {
        setTypingUsers(prev => new Set([...prev, data.username]));

        // Remover após 3 segundos
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.username);
            return newSet;
          });
        }, 3000);
      }
    });

    socket.on('user_stop_typing', (data) => {
      if (data.user_id !== user?._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        });
      }
    });

    socket.on('order_status_update', (data) => {
      console.log('Status do pedido atualizado:', data);
      toast.info(data.message);

      // Adicionar mensagem do sistema
      const systemMessage = {
        _id: `system_${Date.now()}`,
        content: data.message,
        is_system: true,
        created_at: data.timestamp,
        room_id: currentRoom?._id
      };

      if (currentRoom) {
        setMessages(prev => [...prev, systemMessage]);
      }
    });

    socket.on('system_notification', (data) => {
      toast.info(data.message);
    });

    socket.on('error', (error) => {
      console.error('Erro no chat:', error);
      toast.error(error.message || 'Erro no chat');
    });
  };

  const startPingInterval = () => {
    // Ping a cada 30 segundos para manter conexão viva
    pingIntervalRef.current = setInterval(() => {
      if (chatService.isConnected()) {
        chatService.ping();
      }
    }, 30000);
  };

  const disconnect = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (socketRef.current) {
      chatService.disconnect();
      socketRef.current = null;
    }

    setConnected(false);
    setCurrentRoom(null);
    setMessages([]);
    setTypingUsers(new Set());
  };

  const loadChatRooms = async () => {
    try {
      const result = await chatService.getChatRooms();
      if (result.success) {
        setRooms(result.data.rooms);

        // Calcular total de não lidas
        const totalUnread = result.data.rooms.reduce((sum, room) => sum + room.unread_count, 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    }
  };

  const joinRoom = async (roomId) => {
    if (chatService.isConnected()) {
      // Sair da sala atual
      if (currentRoom) {
        chatService.leaveRoom(currentRoom._id);
      }

      // Entrar na nova sala
      chatService.joinRoom(roomId);

      // Buscar dados da sala
      const roomData = rooms.find(r => r._id === roomId);
      setCurrentRoom(roomData);

      // Carregar mensagens via API
      try {
        const messagesResult = await chatService.getRoomMessages(roomId);
        if (messagesResult.success) {
          setMessages(messagesResult.data.messages);
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      }

      // Atualizar contador de não lidas
      await loadChatRooms();
    } else {
      toast.warning('Conectando ao chat...');
    }
  };

  const leaveRoom = () => {
    if (currentRoom && chatService.isConnected()) {
      chatService.leaveRoom(currentRoom._id);
      setCurrentRoom(null);
      setMessages([]);
      setTypingUsers(new Set());
    }
  };

  const sendMessage = async (content) => {
    if (!currentRoom || !content.trim()) return false;

    if (chatService.isConnected()) {
      // Tentar via WebSocket primeiro
      const success = chatService.sendMessage(currentRoom._id, content);
      if (success) {
        return true;
      }
    }

    // Fallback para API REST
    try {
      const result = await chatService.sendMessageRest(currentRoom._id, content);
      if (result.success) {
        // Adicionar mensagem localmente
        setMessages(prev => [...prev, result.data.message]);
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
      return false;
    }
  };

  const startTyping = () => {
    if (currentRoom && chatService.isConnected()) {
      chatService.startTyping(currentRoom._id);
    }
  };

  const stopTyping = () => {
    if (currentRoom && chatService.isConnected()) {
      chatService.stopTyping(currentRoom._id);
    }
  };

  // Solicitar permissão para notificações
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('Notificações ativadas!');
        }
      });
    }
  };

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  return {
    connected,
    rooms,
    currentRoom,
    messages,
    typingUsers,
    unreadCount,
    loadChatRooms,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    requestNotificationPermission
  };
};