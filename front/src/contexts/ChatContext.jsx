import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chatService';
import { toast } from 'react-toastify';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat deve ser usado dentro de um ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Verificar se o chat está habilitado
  useEffect(() => {
    if (isAuthenticated) {
      checkChatStatus();
      loadConversations();
    }
  }, [isAuthenticated]);

  const checkChatStatus = async () => {
    try {
      const result = await chatService.getChatStatus();
      if (result.success) {
        setChatEnabled(result.data.enabled);
      }
    } catch (error) {
      console.error('Erro ao verificar status do chat:', error);
    }
  };

  const loadConversations = async () => {
    if (!isAuthenticated || !chatEnabled) return;

    setLoading(true);
    try {
      const result = await chatService.getConversations();
      if (result.success) {
        setConversations(result.data.conversations || []);
        // Calcular mensagens não lidas
        const unread = result.data.conversations?.reduce((total, conv) => total + (conv.unread_count || 0), 0) || 0;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId) return;

    try {
      const result = await chatService.getMessages(conversationId);
      if (result.success) {
        setMessages(result.data.messages || []);
        // Marcar mensagens como lidas
        await chatService.markAsRead(conversationId);
        // Atualizar contador de não lidas
        updateUnreadCount(conversationId, 0);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    }
  };

  const sendMessage = async (conversationId, content, type = 'text') => {
    if (!conversationId || !content.trim()) return;

    try {
      const result = await chatService.sendMessage(conversationId, {
        content: content.trim(),
        type
      });

      if (result.success) {
        // Adicionar mensagem às mensagens locais
        const newMessage = result.data.message;
        setMessages(prev => [...prev, newMessage]);
        
        // Atualizar conversa na lista
        setConversations(prev => prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, last_message: newMessage, updated_at: newMessage.created_at }
            : conv
        ));

        return result;
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const startConversation = async (otherUserId, initialMessage = '', adId = null) => {
    if (!otherUserId) return;

    try {
      const result = await chatService.startConversation({
        other_user_id: otherUserId,
        initial_message: initialMessage,
        ad_id: adId
      });

      if (result.success) {
        const newConversation = result.data.conversation;
        
        // Adicionar à lista de conversas se não existir
        setConversations(prev => {
          const exists = prev.find(conv => conv._id === newConversation._id);
          if (!exists) {
            return [newConversation, ...prev];
          }
          return prev;
        });

        // Definir como conversa ativa
        setActiveConversation(newConversation);
        
        // Carregar mensagens
        await loadMessages(newConversation._id);

        return result;
      }
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      toast.error('Erro ao iniciar conversa');
    }
  };

  const updateUnreadCount = (conversationId, count) => {
    setConversations(prev => prev.map(conv => 
      conv._id === conversationId 
        ? { ...conv, unread_count: count }
        : conv
    ));
    
    // Recalcular total
    setUnreadCount(prev => {
      const currentConv = conversations.find(c => c._id === conversationId);
      const oldCount = currentConv?.unread_count || 0;
      return Math.max(0, prev - oldCount + count);
    });
  };

  const deleteConversation = async (conversationId) => {
    try {
      const result = await chatService.deleteConversation(conversationId);
      if (result.success) {
        setConversations(prev => prev.filter(conv => conv._id !== conversationId));
        if (activeConversation?._id === conversationId) {
          setActiveConversation(null);
          setMessages([]);
        }
        toast.success('Conversa excluída');
      }
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      toast.error('Erro ao excluir conversa');
    }
  };

  const value = {
    conversations,
    activeConversation,
    messages,
    loading,
    chatEnabled,
    unreadCount,
    setActiveConversation,
    loadConversations,
    loadMessages,
    sendMessage,
    startConversation,
    deleteConversation,
    checkChatStatus
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};