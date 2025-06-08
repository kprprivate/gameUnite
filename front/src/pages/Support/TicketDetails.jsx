import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft,
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  Hash,
  MessageCircle,
  Send,
  FileText,
  Edit,
  Shield,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer
} from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import { toast } from 'react-toastify';
import { supportService } from '../../services/supportService';

const TicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  useEffect(() => {
    loadTicketDetails();
  }, [ticketId]);

  const loadTicketDetails = async () => {
    setLoading(true);
    try {
      let result;
      
      console.log('🔍 Carregando ticket:', ticketId);
      
      // Try to get by protocol number first, then by ID
      if (ticketId.startsWith('SUP-')) {
        console.log('📋 Buscando por protocolo');
        result = await supportService.getTicketByProtocol(ticketId);
      } else {
        console.log('📋 Buscando por ID');
        result = await supportService.getTicketById(ticketId);
      }

      console.log('📄 Resultado da busca:', result);

      if (result.success) {
        const ticketData = result.data.ticket || result.data;
        console.log('🎯 Ticket carregado:', ticketData);
        setTicket(ticketData);
      } else {
        console.error('❌ Erro ao carregar ticket:', result.message);
        toast.error(result.message || 'Ticket não encontrado');
        navigate('/support');
      }
    } catch (error) {
      console.error('❌ Erro no carregamento:', error);
      
      // If rate limited, show a better message
      if (error.response?.status === 429) {
        toast.error('Muitas requisições. Aguarde um momento e tente novamente.');
      } else if (error.response?.status === 404) {
        toast.error('Ticket não encontrado');
      } else {
        toast.error('Erro ao carregar detalhes do ticket');
      }
      navigate('/support');
    }
    setLoading(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Não disponível';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `há ${diffDays} dia(s)`;
      } else if (diffHours > 0) {
        return `há ${diffHours} hora(s)`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `há ${Math.max(1, diffMinutes)} minuto(s)`;
      }
    } catch (error) {
      return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'warning';
      case 'in_progress': return 'primary';
      case 'resolved': return 'success';
      case 'closed': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Andamento';
      case 'resolved': return 'Resolvido';
      case 'closed': return 'Fechado';
      default: return status || 'Desconhecido';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Timer className="w-4 h-4" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'secondary';
      case 'medium': return 'primary';
      case 'high': return 'warning';
      case 'urgent': return 'danger';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      case 'urgent': return 'Urgente';
      default: return priority || 'Não definida';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'general': return 'Geral';
      case 'technical': return 'Técnico';
      case 'billing': return 'Pagamento';
      case 'account': return 'Conta';
      default: return category || 'Não categorizado';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'general': return <Info className="w-4 h-4" />;
      case 'technical': return <Shield className="w-4 h-4" />;
      case 'billing': return <FileText className="w-4 h-4" />;
      case 'account': return <User className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const handleAddReply = async () => {
    if (!replyText.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    if (replyText.trim().length < 5) {
      toast.error('A mensagem deve ter pelo menos 5 caracteres');
      return;
    }

    setUpdating(true);
    try {
      console.log('📤 Enviando resposta para ticket:', ticket._id);
      const result = await supportService.addTicketReply(ticket._id, replyText.trim());
      
      console.log('📨 Resultado do envio:', result);
      
      if (result.success) {
        toast.success('Informação adicionada com sucesso');
        setReplyText('');
        setShowReplyForm(false);
        
        // Reload ticket details to show the new reply
        await loadTicketDetails();
      } else {
        toast.error(result.message || 'Erro ao adicionar informação');
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar resposta:', error);
      toast.error('Erro ao adicionar informação');
    }
    setUpdating(false);
  };

  const handleRefresh = () => {
    toast.info('Atualizando ticket...');
    loadTicketDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando detalhes do ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Ticket não encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            O ticket solicitado não existe ou você não tem permissão para visualizá-lo.
          </p>
          <Button onClick={() => navigate('/support')}>
            Voltar ao Suporte
          </Button>
        </div>
      </div>
    );
  }

  const canAddReply = ticket.status === 'open' || ticket.status === 'in_progress';
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Navigation */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/support')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Suporte
            </Button>
            
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Ticket Header Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800 mb-3">
                  {ticket.subject || 'Sem assunto'}
                </h1>
                
                {/* Status and Priority Badges */}
                <div className="flex items-center flex-wrap gap-3 mb-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                    <Badge variant={getStatusColor(ticket.status || 'open')}>
                      {getStatusLabel(ticket.status || 'open')}
                    </Badge>
                  </div>
                  
                  <Badge variant={getPriorityColor(ticket.priority || 'medium')} size="sm">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {getPriorityLabel(ticket.priority || 'medium')}
                  </Badge>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    {getCategoryIcon(ticket.category)}
                    <span className="ml-1">{getCategoryLabel(ticket.category || 'general')}</span>
                  </div>
                </div>

                {/* Ticket Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      Criado em {formatTime(ticket.created_at)}
                      {ticket.created_at && (
                        <span className="text-gray-500 ml-2">
                          ({formatRelativeTime(ticket.created_at)})
                        </span>
                      )}
                    </span>
                  </div>
                  
                  {ticket.protocol_number && (
                    <div className="flex items-center font-mono">
                      <Hash className="w-4 h-4 mr-2" />
                      <span className="font-medium">{ticket.protocol_number}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>ID: #{ticket._id ? ticket._id.slice(-8) : 'N/A'}</span>
                  </div>
                  
                  {ticket.updated_at && (
                    <div className="flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      <span>
                        Atualizado {formatRelativeTime(ticket.updated_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 ml-4">
                {canAddReply && (
                  <Button 
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className={showReplyForm ? 'bg-gray-600' : ''}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {showReplyForm ? 'Cancelar' : 'Adicionar Info'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {/* Original Message */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
              Descrição do Problema
            </h3>
            <div className="bg-gray-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {ticket.message || 'Nenhuma descrição fornecida.'}
              </p>
            </div>
          </div>

          {/* Admin Response */}
          {ticket.admin_response && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Resposta da Equipe de Suporte
              </h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-blue-700 font-medium mb-2">
                      Equipe de Suporte
                      {ticket.resolved_at && (
                        <span className="ml-2 text-xs bg-blue-100 px-2 py-1 rounded">
                          Respondido em {formatTime(ticket.resolved_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 leading-relaxed">{ticket.admin_response}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information from User */}
          {ticket.additional_info && ticket.additional_info.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Edit className="w-5 h-5 mr-2 text-green-600" />
                Informações Adicionais
                <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                  {ticket.additional_info.length} mensagem(ns)
                </span>
              </h3>
              <div className="space-y-4">
                {ticket.additional_info.map((info, index) => (
                  <div key={index} className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-green-700 font-medium mb-1">
                          Você • {formatTime(info.created_at)}
                          <span className="text-green-600 ml-2">
                            ({formatRelativeTime(info.created_at)})
                          </span>
                        </div>
                        <p className="text-gray-800 leading-relaxed">{info.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Reply Form */}
          {showReplyForm && canAddReply && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Send className="w-5 h-5 mr-2 text-blue-600" />
                Adicionar Informação
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descreva informações adicionais sobre seu problema:
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Forneça mais detalhes, capturas de tela que podem ajudar, ou atualizações sobre o problema..."
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                    rows="5"
                    maxLength="1000"
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {replyText.length}/1000 caracteres
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={handleAddReply}
                    disabled={updating || !replyText.trim() || replyText.trim().length < 5}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {updating ? 'Enviando...' : 'Enviar Informação'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyText('');
                    }}
                    disabled={updating}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Status Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-purple-600" />
              Informações do Ticket
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Status atual:</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                    <span className={`font-medium ${
                      ticket.status === 'open' ? 'text-orange-600' : 
                      ticket.status === 'in_progress' ? 'text-blue-600' :
                      ticket.status === 'resolved' ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Prioridade:</span>
                  <Badge variant={getPriorityColor(ticket.priority)}>
                    {getPriorityLabel(ticket.priority)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Categoria:</span>
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(ticket.category)}
                    <span className="text-gray-800">{getCategoryLabel(ticket.category)}</span>
                  </div>
                </div>
              </div>
              
              {/* Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Criado em:</span>
                  <span className="text-gray-800 text-sm">
                    {formatTime(ticket.created_at)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Última atualização:</span>
                  <span className="text-gray-800 text-sm">
                    {formatTime(ticket.updated_at)}
                  </span>
                </div>

                {ticket.resolved_at && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">Resolvido em:</span>
                    <span className="text-green-800 text-sm">
                      {formatTime(ticket.resolved_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Message */}
            <div className={`mt-6 p-4 rounded-lg border-l-4 ${
              ticket.status === 'open' ? 'bg-orange-50 border-orange-500' :
              ticket.status === 'in_progress' ? 'bg-blue-50 border-blue-500' :
              ticket.status === 'resolved' ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-500'
            }`}>
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  ticket.status === 'open' ? 'bg-orange-500' :
                  ticket.status === 'in_progress' ? 'bg-blue-500' :
                  ticket.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                }`}>
                  {getStatusIcon(ticket.status)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${
                    ticket.status === 'open' ? 'text-orange-800' :
                    ticket.status === 'in_progress' ? 'text-blue-800' :
                    ticket.status === 'resolved' ? 'text-green-800' : 'text-gray-800'
                  }`}>
                    {ticket.status === 'open' && 
                      'Seu ticket foi recebido e está aguardando análise da nossa equipe de suporte. Você será notificado quando houver atualizações.'
                    }
                    {ticket.status === 'in_progress' && 
                      'Nossa equipe está analisando seu problema e trabalhando em uma solução. Mantenha-se atento para atualizações.'
                    }
                    {ticket.status === 'resolved' && 
                      'Seu ticket foi resolvido pela nossa equipe. Se o problema persistir, você pode adicionar mais informações ou criar um novo ticket.'
                    }
                    {ticket.status === 'closed' && 
                      'Este ticket foi fechado. Se você precisar de mais ajuda, crie um novo ticket de suporte.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;