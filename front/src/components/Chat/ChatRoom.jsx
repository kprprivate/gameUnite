import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import {
  Send,
  User,
  MessageCircle,
  AlertCircle,
  Loader,
  Clock,
  CheckCircle2,
  Phone,
  Video,
  Settings
} from 'lucide-react';
import Button from '../Common/Button';

const ChatRoom = ({ orderId, onClose }) => {
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const [pendingMessages, setPendingMessages] = useState(new Set());
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    initializeChat();
    return () => {
      cleanup();
    };
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    setLoading(true);

    try {
      // Buscar sala de chat
      const roomResult = await chatService.getOrderChatRoom(orderId);
      if (!roomResult.success) {
        toast.error(roomResult.message);
        return;
      }

      setRoom(roomResult.data.room);

      // Conectar ao WebSocket
      const token = localStorage.getItem('access_token') || document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token='))
        ?.split('=')[1];

      if (token) {
        const socketInstance = chatService.connect(token);
        setSocket(socketInstance);

        setupSocketListeners(socketInstance, roomResult.data.room._id);
        
        // Entrar na sala
        socketInstance.emit('join_chat_room', { room_id: roomResult.data.room._id });
      }

    } catch (error) {
      console.error('Erro ao inicializar chat:', error);
      toast.error('Erro ao carregar chat');
    }

    setLoading(false);
  };

  const setupSocketListeners = (socketInstance, roomId) => {
    socketInstance.on('connected', () => {
      setConnected(true);
      console.log('Conectado ao chat');
    });

    socketInstance.on('room_joined', (data) => {
      console.log('Entrou na sala:', data);
      setMessages(data.messages || []);
    });

    socketInstance.on('new_message', (data) => {
      const message = data.message;
      if (message.room_id === roomId) {
        
        setMessages(prev => {
          // Se é minha mensagem confirmada e tem temp_id, substituir a temporária
          if (message.user_id === user._id && message.temp_id) {
            // Remover mensagem temporária e adicionar a confirmada
            const withoutTemp = prev.filter(msg => msg.temp_id !== message.temp_id);
            return [...withoutTemp, message];
          }
          
          // Se é minha mensagem confirmada mas sem temp_id, verificar se já existe temporária similar
          if (message.user_id === user._id) {
            // Procurar por mensagem temporária com conteúdo similar enviada recentemente (últimos 10 segundos)
            const recentTime = Date.now() - 10000; // 10 segundos
            const tempIndex = prev.findIndex(msg => 
              msg.is_pending && 
              msg.user_id === user._id && 
              msg.content === message.content &&
              new Date(msg.created_at).getTime() > recentTime
            );
            
            if (tempIndex !== -1) {
              // Substituir mensagem temporária pela confirmada
              const newMessages = [...prev];
              newMessages[tempIndex] = message;
              return newMessages;
            }
          }
          
          // Caso normal: apenas adicionar a mensagem
          return [...prev, message];
        });
        
        // Se é minha mensagem, remover do estado de pendente
        if (message.user_id === user._id && message.temp_id) {
          setPendingMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(message.temp_id);
            return newSet;
          });
        }
        
        // Tocar som de notificação se não for própria mensagem
        if (message.user_id !== user._id) {
          playNotificationSound();
        }
      }
    });

    socketInstance.on('user_typing', (data) => {
      if (data.user_id !== user._id) {
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

    socketInstance.on('user_stop_typing', (data) => {
      if (data.user_id !== user._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        });
      }
    });

    socketInstance.on('system_notification', (data) => {
      toast.info(data.message);
    });

    socketInstance.on('error', (error) => {
      console.error('Erro no WebSocket:', error);
      toast.error(error.message || 'Erro na conexão');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('Desconectado do chat');
    });
  };

  const cleanup = () => {
    if (socket) {
      if (room) {
        socket.emit('leave_chat_room', { room_id: room._id });
      }
      chatService.disconnect();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignorar erro se não conseguir tocar
      });
    } catch (error) {
      // Ignorar erro de som
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !connected) return;

    setSending(true);
    const tempId = Date.now().toString();
    const messageContent = newMessage.trim();

    try {
      // Adicionar mensagem temporária com status pendente
      const tempMessage = {
        _id: tempId,
        temp_id: tempId,
        content: messageContent,
        user_id: user._id,
        user: user,
        created_at: new Date().toISOString(),
        room_id: room._id,
        is_pending: true
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setPendingMessages(prev => new Set([...prev, tempId]));
      setNewMessage('');
      
      // Timeout para remover mensagem temporária se não receber confirmação
      setTimeout(() => {
        setPendingMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });
      }, 30000); // 30 segundos
      
      // Enviar via WebSocket
      if (socket && room) {
        socket.emit('send_message', {
          room_id: room._id,
          content: messageContent,
          temp_id: tempId
        });
        
        messageInputRef.current?.focus();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
      
      // Remover mensagem temporária em caso de erro
      setMessages(prev => prev.filter(msg => msg.temp_id !== tempId));
      setPendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempId);
        return newSet;
      });
    }

    setSending(false);
  };

  const handleTyping = () => {
    if (socket && room && connected) {
      socket.emit('typing', { room_id: room._id });
      
      // Parar de indicar typing após 2 segundos
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { room_id: room._id });
      }, 2000);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getMessageStatus = (message) => {
    if (message.user_id === user._id) {
      // Se é mensagem temporária e ainda está em pendingMessages, está sendo enviada
      if (message.is_pending && message.temp_id && pendingMessages.has(message.temp_id)) {
        return 'pending';
      }
      
      // Se tem _id do servidor, foi confirmada
      if (message._id && !message.is_pending) {
        return message.read_by?.length > 1 ? 'read' : 'sent';
      }
      
      // Caso padrão para mensagens enviadas
      return 'sent';
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Carregando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-800">Chat do Pedido</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600">
                {connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            title="Chamada de voz (em breve)"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            title="Chamada de vídeo (em breve)"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status da conexão */}
      {!connected && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center text-yellow-800">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">Reconectando ao chat...</span>
          </div>
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhuma mensagem ainda</p>
            <p className="text-sm text-gray-500">
              Inicie a conversa sobre este pedido
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.user_id === user._id;
            const isSystemMessage = message.is_system;
            
            return (
              <div
                key={message._id || index}
                className={`flex ${
                  isSystemMessage 
                    ? 'justify-center' 
                    : isOwnMessage 
                    ? 'justify-end' 
                    : 'justify-start'
                }`}
              >
                {isSystemMessage ? (
                  <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm border border-blue-200">
                    {message.content}
                  </div>
                ) : (
                  <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'ml-12' : 'mr-12'}`}>
                    {!isOwnMessage && message.user && (
                      <div className="flex items-center mb-1">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                          {message.user.profile_pic ? (
                            <img
                              src={message.user.profile_pic}
                              alt={message.user.username}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-3 h-3 text-gray-600" />
                          )}
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {message.user.first_name || message.user.username}
                        </span>
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      <div className={`flex items-center justify-between mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatTime(message.created_at)}
                        </span>
                        
                        {isOwnMessage && (
                          <div className="ml-2">
                            {(() => {
                              const status = getMessageStatus(message);
                              switch (status) {
                                case 'pending':
                                  return <Clock className="w-3 h-3" />;
                                case 'read':
                                  return <CheckCircle2 className="w-3 h-3" />;
                                case 'sent':
                                default:
                                  return <CheckCircle2 className="w-3 h-3 opacity-60" />;
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Indicador de digitação */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md mr-12">
              <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-1">
                  <span className="text-sm">
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'está' : 'estão'} digitando
                  </span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensagem */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            ref={messageInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={connected ? "Digite sua mensagem..." : "Aguardando conexão..."}
            className="chat-input flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            disabled={!connected}
            maxLength={1000}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending || !connected}
            loading={sending}
            size="sm"
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        {newMessage.length > 800 && (
          <p className="text-xs text-gray-500 mt-1">
            {newMessage.length}/1000 caracteres
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;