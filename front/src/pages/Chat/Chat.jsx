import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { dmService } from '../../services/dmService';
import {
  MessageCircle,
  Send,
  ArrowLeft,
  MoreVertical,
  Trash2,
  User,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import { toast } from 'react-toastify';

const Chat = () => {
  const { userId, adId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { 
    conversations, 
    activeConversation, 
    messages, 
    loading, 
    chatEnabled,
    setActiveConversation,
    loadMessages,
    sendMessage,
    startConversation,
    deleteConversation
  } = useChat();

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!chatEnabled) {
      toast.error('Chat está desabilitado pelos administradores');
      navigate('/');
      return;
    }

    // Se veio com userId, iniciar conversa
    if (userId && userId !== user._id) {
      handleStartConversation(userId);
    }
  }, [userId, adId, isAuthenticated, chatEnabled, navigate, user]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation._id);
      setSelectedConversation(activeConversation);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartConversation = async (otherUserId) => {
    // Verificar se já existe conversa
    const existingConversation = conversations.find(conv => 
      conv.participants.some(p => p._id === otherUserId)
    );

    if (existingConversation) {
      setActiveConversation(existingConversation);
      return;
    }

    // Iniciar nova conversa
    const result = await startConversation(otherUserId, '', adId);
    if (result?.success) {
      setActiveConversation(result.data.conversation);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    
    try {
      const result = await sendMessage(activeConversation._id, newMessage);
      if (result?.success) {
        setNewMessage('');
      }
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (window.confirm('Tem certeza que deseja excluir esta conversa?')) {
      await deleteConversation(conversationId);
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setSelectedConversation(null);
      }
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-4">
            Você precisa estar logado para acessar o chat.
          </p>
          <Button onClick={() => navigate('/login')}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (!chatEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Chat Desabilitado
          </h2>
          <p className="text-gray-600 mb-4">
            O sistema de chat está temporariamente desabilitado pelos administradores.
          </p>
          <Button onClick={() => navigate('/')}>
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden h-[calc(100vh-120px)]">
          <div className="flex h-full">
            {/* Sidebar - Lista de Conversas */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Conversas
                  </h2>
                  <button
                    onClick={() => navigate(-1)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Lista de Conversas */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <LoadingSpinner />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma conversa ainda</p>
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const otherUser = conversation.participants.find(p => p._id !== user._id);
                    
                    return (
                      <div
                        key={conversation._id}
                        onClick={() => setActiveConversation(conversation)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation?._id === conversation._id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            {otherUser?.profile_pic ? (
                              <img
                                src={otherUser.profile_pic}
                                alt={otherUser.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {otherUser?.first_name} {otherUser?.last_name}
                              </p>
                              {conversation.unread_count > 0 && (
                                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                                  {conversation.unread_count}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-500 truncate">
                              @{otherUser?.username}
                            </p>
                            
                            {conversation.last_message && (
                              <p className="text-xs text-gray-400 truncate mt-1">
                                {conversation.last_message.content}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(conversation._id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200">
                    {(() => {
                      const otherUser = selectedConversation.participants.find(p => p._id !== user._id);
                      return (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              {otherUser?.profile_pic ? (
                                <img
                                  src={otherUser.profile_pic}
                                  alt={otherUser.username}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {otherUser?.first_name} {otherUser?.last_name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                @{otherUser?.username}
                              </p>
                            </div>
                          </div>
                          
                          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${
                          message.sender_id === user._id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user._id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === user._id
                                ? 'text-blue-100'
                                : 'text-gray-500'
                            }`}
                          >
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={sending}
                      />
                      <Button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        loading={sending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Selecione uma conversa
                    </h3>
                    <p className="text-gray-500">
                      Escolha uma conversa da lista para começar a conversar
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;