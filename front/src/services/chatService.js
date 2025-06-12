// front/src/services/chatService.js - CORREÇÃO DO PROCESSO ENV
import { io } from 'socket.io-client';
import api from './api';

class ChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = null;
  }

  // Conectar ao WebSocket
  connect(token) {
    try {
      console.log('🔌 Conectando ao chat WebSocket...');

      if (this.socket) {
        this.disconnect();
      }

      // Dynamic WebSocket URL based on environment
      let socketUrl;
      if (import.meta.env.VITE_WS_URL) {
        socketUrl = import.meta.env.VITE_WS_URL;
      } else if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        socketUrl = 'http://127.0.0.1:5000';
      } else {
        // In production, construct WebSocket URL from current location
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const hostname = window.location.hostname;
        socketUrl = `${protocol}//${hostname}:5000`;
      }

      console.log('🔗 Conectando ao WebSocket em:', socketUrl);

      this.socket = io(socketUrl, {
        auth: { token: `Bearer ${token}` },
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();

      return this.socket;
    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
      return null;
    }
  }

  // Configurar listeners de eventos
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao chat WebSocket');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado do chat WebSocket:', reason);
      this.isConnected = false;

      if (reason === 'io server disconnect') {
        // Reconexão automática se o servidor desconectou
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      this.isConnected = false;
      this.attemptReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('❌ Erro no WebSocket:', error);
    });

    // Eventos específicos do chat
    this.socket.on('connected', (data) => {
      console.log('👤 Chat autenticado:', data);
    });

    this.socket.on('room_joined', (data) => {
      console.log('🏠 Sala joined:', data);
    });

    this.socket.on('new_message', (data) => {
      console.log('💬 Nova mensagem recebida:', data);
    });

    this.socket.on('user_typing', (data) => {
      console.log('⌨️ Usuário digitando:', data);
    });

    this.socket.on('user_stop_typing', (data) => {
      console.log('⏹️ Usuário parou de digitar:', data);
    });

    this.socket.on('order_status_update', (data) => {
      console.log('📦 Status do pedido atualizado:', data);
    });

    this.socket.on('system_notification', (data) => {
      console.log('🔔 Notificação do sistema:', data);
    });
  }

  // Tentar reconectar
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Máximo de tentativas de reconexão atingido');
      return;
    }

    if (this.reconnectInterval) return;

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Backoff exponencial

    console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`);

    this.reconnectInterval = setTimeout(() => {
      this.reconnectInterval = null;
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  // Desconectar
  disconnect() {
    console.log('🔌 Desconectando do chat WebSocket...');

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
  }

  // Verificar se está conectado
  isConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // Entrar em uma sala
  joinRoom(roomId) {
    if (!this.isConnected() || !roomId) {
      console.warn('⚠️ Não é possível entrar na sala - não conectado');
      return false;
    }

    console.log('🏠 Entrando na sala:', roomId);
    this.socket.emit('join_chat_room', { room_id: roomId });
    return true;
  }

  // Sair de uma sala
  leaveRoom(roomId) {
    if (!this.isConnected() || !roomId) {
      console.warn('⚠️ Não é possível sair da sala - não conectado');
      return false;
    }

    console.log('🚪 Saindo da sala:', roomId);
    this.socket.emit('leave_chat_room', { room_id: roomId });
    return true;
  }

  // Enviar mensagem
  sendMessage(roomId, content) {
    if (!this.isConnected() || !roomId || !content) {
      console.warn('⚠️ Não é possível enviar mensagem - parâmetros inválidos');
      return false;
    }

    console.log('💬 Enviando mensagem:', { roomId, content });
    this.socket.emit('send_message', {
      room_id: roomId,
      content: content.trim()
    });
    return true;
  }

  // Indicar que está digitando
  startTyping(roomId) {
    if (!this.isConnected() || !roomId) return false;

    this.socket.emit('typing', { room_id: roomId });
    return true;
  }

  // Parar de indicar que está digitando
  stopTyping(roomId) {
    if (!this.isConnected() || !roomId) return false;

    this.socket.emit('stop_typing', { room_id: roomId });
    return true;
  }

  // Ping para manter conexão viva
  ping() {
    if (!this.isConnected()) return false;

    this.socket.emit('ping', { timestamp: Date.now() });
    return true;
  }

  // === API REST METHODS (fallback) ===

  // Buscar salas de chat do usuário
  async getChatRooms() {
    try {
      console.log('🔍 Buscando salas de chat...');

      const response = await api.get('/chat/rooms');

      console.log('📥 Salas de chat:', response.data);

      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message || 'Salas carregadas'
      };
    } catch (error) {
      console.error('❌ Erro ao buscar salas:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao carregar salas',
        data: { rooms: [] }
      };
    }
  }

  // Buscar sala de chat de um pedido
  async getOrderChatRoom(orderId) {
    try {
      console.log('🔍 Buscando sala do pedido:', orderId);

      const response = await api.get(`/chat/room/${orderId}`);

      console.log('📥 Sala do pedido:', response.data);

      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message || 'Sala encontrada'
      };
    } catch (error) {
      console.error('❌ Erro ao buscar sala do pedido:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar sala',
        data: null
      };
    }
  }

  // Buscar mensagens de uma sala
  async getRoomMessages(roomId, limit = 50, skip = 0) {
    try {
      console.log('🔍 Buscando mensagens da sala:', roomId);

      const response = await api.get(`/chat/room/${roomId}/messages?limit=${limit}&skip=${skip}`);

      console.log('📥 Mensagens da sala:', response.data);

      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message || 'Mensagens carregadas'
      };
    } catch (error) {
      console.error('❌ Erro ao buscar mensagens:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao carregar mensagens',
        data: { messages: [] }
      };
    }
  }

  // Enviar mensagem via REST (fallback)
  async sendMessageRest(roomId, content) {
    try {
      console.log('📤 Enviando mensagem via REST:', { roomId, content });

      const response = await api.post(`/chat/room/${roomId}/message`, {
        content: content.trim()
      });

      console.log('📥 Resposta do envio:', response.data);

      return {
        success: response.data.success || true,
        data: response.data.data || response.data,
        message: response.data.message || 'Mensagem enviada'
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via REST:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao enviar mensagem'
      };
    }
  }

  // Adicionar listener personalizado
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remover listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Obter status da conexão
  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      socket: !!this.socket,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // Verificar status do chat (sempre habilitado por enquanto)
  async getChatStatus() {
    try {
      return {
        success: true,
        data: { enabled: true }
      };
    } catch (error) {
      console.error('Erro ao verificar status do chat:', error);
      return {
        success: false,
        data: { enabled: true }
      };
    }
  }

  // Buscar salas de chat (conversas) do usuário
  async getConversations() {
    try {
      const response = await api.get('/chat/rooms');
      return {
        success: true,
        data: { conversations: response.data.data || [] }
      };
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      return {
        success: false,
        data: { conversations: [] }
      };
    }
  }

  // Buscar mensagens de uma sala de chat
  async getMessages(roomId) {
    try {
      const response = await api.get(`/chat/room/${roomId}/messages`);
      return {
        success: true,
        data: { messages: response.data.data || [] }
      };
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      return {
        success: false,
        data: { messages: [] }
      };
    }
  }

  // Enviar mensagem em uma sala
  async sendMessage(roomId, messageData) {
    try {
      const response = await api.post(`/chat/room/${roomId}/message`, {
        content: messageData.content
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return {
        success: false,
        message: 'Erro ao enviar mensagem'
      };
    }
  }

  // Buscar ou criar sala de chat para um pedido
  async startConversation(conversationData) {
    try {
      // Para o sistema de chat baseado em pedidos, usar o orderId para buscar/criar sala
      const orderId = conversationData.order_id || conversationData.ad_id;
      if (!orderId) {
        return {
          success: false,
          message: 'ID do pedido é obrigatório'
        };
      }

      const response = await api.get(`/chat/room/${orderId}`);
      return {
        success: true,
        data: { conversation: response.data.data }
      };
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      return {
        success: false,
        message: 'Erro ao iniciar conversa'
      };
    }
  }

  // Marcar mensagens como lidas
  async markAsRead(roomId) {
    try {
      const response = await api.patch(`/chat/room/${roomId}/read`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      return {
        success: false,
        message: 'Erro ao marcar mensagens como lidas'
      };
    }
  }

  // Excluir conversa
  async deleteConversation(roomId) {
    try {
      const response = await api.delete(`/chat/room/${roomId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      return {
        success: false,
        message: 'Erro ao excluir conversa'
      };
    }
  }
}

// Instância singleton
export const chatService = new ChatService();

// Export para compatibilidade
export default chatService;