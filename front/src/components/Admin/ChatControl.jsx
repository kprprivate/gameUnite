import React, { useState, useEffect } from 'react';
import { dmService } from '../../services/dmService';
import { MessageCircle, ToggleLeft, ToggleRight, Users, Eye } from 'lucide-react';
import { Card, Button, LoadingSpinner, Badge } from '../Common';
import { toast } from 'react-toastify';

const ChatControl = () => {
  const [chatStatus, setChatStatus] = useState({
    enabled: true,
    totalConversations: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  useEffect(() => {
    loadChatStatus();
    loadConversations();
  }, []);

  const loadChatStatus = async () => {
    setLoading(true);
    try {
      const result = await dmService.getChatStatus();
      if (result.success) {
        setChatStatus(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar status do chat:', error);
      toast.error('Erro ao carregar status do chat');
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    setConversationsLoading(true);
    try {
      const result = await dmService.getAllConversations();
      if (result.success) {
        setConversations(result.data.conversations || []);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setConversationsLoading(false);
    }
  };

  const handleToggleChat = async () => {
    const newStatus = !chatStatus.enabled;
    
    if (!window.confirm(
      newStatus 
        ? 'Tem certeza que deseja habilitar o sistema de chat?' 
        : 'Tem certeza que deseja desabilitar o sistema de chat? Isso impedirá que usuários enviem mensagens.'
    )) {
      return;
    }

    setToggling(true);
    try {
      const result = await dmService.toggleChatStatus(newStatus);
      if (result.success) {
        setChatStatus(prev => ({ ...prev, enabled: newStatus }));
        toast.success(
          newStatus 
            ? 'Sistema de chat habilitado com sucesso!' 
            : 'Sistema de chat desabilitado com sucesso!'
        );
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao alterar status do chat:', error);
      toast.error('Erro ao alterar status do chat');
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Controle de Chat</h2>
          <p className="text-gray-600">Gerencie o sistema de mensagens diretas entre usuários</p>
        </div>
      </div>

      {/* Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              chatStatus.enabled ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <MessageCircle className={`w-6 h-6 ${
                chatStatus.enabled ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Sistema de Chat
              </h3>
              <p className="text-sm text-gray-600">
                Status atual: {chatStatus.enabled ? 'Habilitado' : 'Desabilitado'}
              </p>
            </div>
          </div>

          <Button
            onClick={handleToggleChat}
            disabled={toggling}
            variant={chatStatus.enabled ? 'danger' : 'success'}
            className="flex items-center space-x-2"
          >
            {chatStatus.enabled ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
            <span>
              {toggling 
                ? 'Alterando...' 
                : chatStatus.enabled 
                ? 'Desabilitar Chat' 
                : 'Habilitar Chat'
              }
            </span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total de Conversas</p>
                <p className="text-2xl font-bold text-blue-900">{conversations.length}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-900">{chatStatus.activeUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Status</p>
                <Badge variant={chatStatus.enabled ? 'success' : 'danger'}>
                  {chatStatus.enabled ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {chatStatus.enabled ? (
                <ToggleRight className="w-8 h-8 text-yellow-600" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-yellow-600" />
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Conversations */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Conversas Recentes
          </h3>
          <Button
            onClick={loadConversations}
            variant="outline"
            size="sm"
            disabled={conversationsLoading}
          >
            Atualizar
          </Button>
        </div>

        {conversationsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participantes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Mensagem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conversations.slice(0, 10).map((conversation) => (
                  <tr key={conversation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {conversation.participants.map((participant, index) => (
                          <span key={participant._id} className="text-sm text-gray-900">
                            {participant.username}
                            {index < conversation.participants.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {conversation.last_message?.content || 'Sem mensagens'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(conversation.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Como funciona o controle de chat
        </h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• <strong>Habilitar/Desabilitar:</strong> Use o botão acima para controlar se os usuários podem enviar mensagens diretas</li>
          <li>• <strong>Quando desabilitado:</strong> A opção de enviar mensagem não aparece nos anúncios</li>
          <li>• <strong>Conversas existentes:</strong> Permanecem visíveis mesmo quando o chat está desabilitado</li>
          <li>• <strong>Acesso a pedidos:</strong> Admins podem acessar conversas de pedidos reportados através da gestão de pedidos</li>
        </ul>
      </Card>
    </div>
  );
};

export default ChatControl;