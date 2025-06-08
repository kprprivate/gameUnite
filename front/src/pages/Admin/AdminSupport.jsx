import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Search, 
  Filter, 
  Eye, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  User,
  Calendar,
  Hash,
  RefreshCw,
  Shield,
  Settings,
  BarChart3,
  Users,
  FileText,
  XCircle,
  Timer,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import { toast } from 'react-toastify';
import { supportService } from '../../services/supportService';

const AdminSupport = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    search: ''
  });
  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    admin_response: ''
  });

  useEffect(() => {
    loadData();
  }, [currentPage, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTickets(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do painel');
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      };

      console.log('📋 Carregando tickets admin com params:', params);
      const result = await supportService.getAllTickets(params);
      
      console.log('📄 Resposta getAllTickets:', result);
      
      if (result && result.data) {
        const responseData = result.data.data || result.data;
        setTickets(responseData.tickets || []);
        setTotalPages(responseData.total_pages || 1);
        console.log('✅ Tickets carregados:', responseData.tickets?.length || 0);
      } else {
        console.error('❌ Estrutura de resposta inesperada:', result);
        setTickets([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tickets:', error);
      toast.error('Erro ao carregar tickets');
      setTickets([]);
    }
  };

  const loadStats = async () => {
    try {
      console.log('📊 Carregando estatísticas...');
      const result = await supportService.getAdminStats();
      
      console.log('📈 Resposta getAdminStats:', result);
      
      if (result && result.data) {
        const statsData = result.data.data || result.data;
        setStats(statsData);
        console.log('✅ Stats carregadas:', statsData);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar stats:', error);
      // Don't show error toast for stats, it's not critical
    }
  };

  const handleTicketUpdate = async (ticketId, updateData) => {
    setUpdating(true);
    try {
      console.log('🔄 Atualizando ticket:', ticketId, updateData);
      
      const result = await supportService.updateTicket(ticketId, updateData);
      
      console.log('✅ Resultado da atualização:', result);
      
      if (result && result.data) {
        toast.success('Ticket atualizado com sucesso');
        setShowTicketModal(false);
        setSelectedTicket(null);
        await loadTickets(); // Reload tickets
      } else {
        toast.error('Erro ao atualizar ticket');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar ticket:', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar ticket');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setFormData({
      status: ticket.status || '',
      priority: ticket.priority || '',
      admin_response: ticket.admin_response || ''
    });
    setShowTicketModal(true);
  };

  const handleToggleExpand = (ticketId) => {
    const newExpanded = new Set(expandedTickets);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedTickets(newExpanded);
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
        minute: '2-digit'
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
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
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

  const getTicketCount = (status) => {
    if (!Array.isArray(tickets)) return 0;
    return status === 'all' ? tickets.length : tickets.filter(t => t.status === status).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Painel de Suporte
                </h1>
                <p className="text-gray-600">
                  Gerencie tickets de suporte dos usuários
                </p>
              </div>
            </div>
            
            <Button 
              onClick={loadData}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Tickets</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.tickets?.total || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tickets Abertos</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.tickets?.open || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Timer className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Em Andamento</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.tickets?.in_progress || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Resolvidos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tickets.filter(t => t.status === 'resolved').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar tickets..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os Status</option>
                <option value="open">Aberto</option>
                <option value="in_progress">Em Andamento</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as Prioridades</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as Categorias</option>
                <option value="general">Geral</option>
                <option value="technical">Técnico</option>
                <option value="billing">Pagamento</option>
                <option value="account">Conta</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {Array.isArray(tickets) && tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                {/* Ticket Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {ticket.subject || 'Sem assunto'}
                      </h3>
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
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {ticket.user?.username || ticket.user_name || 'Usuário desconhecido'}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatTime(ticket.created_at)}
                        {ticket.created_at && (
                          <span className="text-gray-400 ml-2">
                            ({formatRelativeTime(ticket.created_at)})
                          </span>
                        )}
                      </span>
                      {ticket.protocol_number && (
                        <span className="flex items-center font-mono text-blue-600">
                          <Hash className="w-4 h-4 mr-1" />
                          {ticket.protocol_number}
                        </span>
                      )}
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {getCategoryLabel(ticket.category || 'general')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleExpand(ticket._id)}
                    >
                      {expandedTickets.has(ticket._id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleViewTicket(ticket)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Gerenciar
                    </Button>
                  </div>
                </div>

                {/* Ticket Preview */}
                <div className="border-l-4 border-gray-200 pl-4 mb-4">
                  <p className="text-gray-700 line-clamp-2">
                    {ticket.message || 'Sem mensagem'}
                  </p>
                </div>

                {/* Expanded Content */}
                {expandedTickets.has(ticket._id) && (
                  <div className="border-t pt-4 space-y-4">
                    {/* Full Message */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Descrição Completa:</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {ticket.message || 'Sem mensagem'}
                        </p>
                      </div>
                    </div>

                    {/* Admin Response */}
                    {ticket.admin_response && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Resposta da Equipe:</h4>
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                          <p className="text-gray-800">{ticket.admin_response}</p>
                          {ticket.resolved_at && (
                            <p className="text-xs text-blue-600 mt-2">
                              Respondido em {formatTime(ticket.resolved_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Info */}
                    {ticket.additional_info && ticket.additional_info.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          Informações Adicionais do Usuário:
                        </h4>
                        <div className="space-y-2">
                          {ticket.additional_info.map((info, index) => (
                            <div key={index} className="bg-green-50 border border-green-200 p-3 rounded-lg">
                              <p className="text-gray-800">{info.message}</p>
                              <p className="text-xs text-green-600 mt-1">
                                {formatTime(info.created_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Nenhum ticket encontrado
              </h3>
              <p className="text-gray-600">
                Não há tickets que correspondam aos filtros selecionados.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ticket Management Modal */}
        {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Gerenciar Ticket
                  </h3>
                  <button 
                    onClick={() => setShowTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Ticket Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">{selectedTicket.subject}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Usuário:</span>
                      <span className="ml-2 font-medium">
                        {selectedTicket.user?.username || selectedTicket.user_name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Protocolo:</span>
                      <span className="ml-2 font-medium font-mono">
                        {selectedTicket.protocol_number || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Criado em:</span>
                      <span className="ml-2">{formatTime(selectedTicket.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Categoria:</span>
                      <span className="ml-2">{getCategoryLabel(selectedTicket.category)}</span>
                    </div>
                  </div>
                </div>

                {/* Update Form */}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleTicketUpdate(selectedTicket._id, formData);
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="open">Aberto</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="resolved">Resolvido</option>
                        <option value="closed">Fechado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prioridade
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resposta da Equipe de Suporte
                    </label>
                    <textarea
                      value={formData.admin_response}
                      onChange={(e) => setFormData(prev => ({ ...prev, admin_response: e.target.value }))}
                      placeholder="Digite sua resposta para o usuário..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="4"
                      maxLength="2000"
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {formData.admin_response.length}/2000 caracteres
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTicketModal(false)}
                      className="flex-1"
                      disabled={updating}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={updating}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {updating ? 'Atualizando...' : 'Atualizar Ticket'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;