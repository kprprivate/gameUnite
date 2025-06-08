import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  Send,
  Search,
  Filter,
  X,
  FileText,
  HelpCircle,
  Mail,
  Phone,
  Hash
} from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import { toast } from 'react-toastify';
import { supportService } from '../../services/supportService';

const Support = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolSearch, setProtocolSearch] = useState('');
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium'
  });

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const loadTickets = async () => {
    setLoading(true);
    
    try {
      const result = await supportService.getUserTickets({
        limit: 50,
        skip: 0,
        status: filter === 'all' ? undefined : filter
      });

      if (result.success) {
        const ticketsData = result.data.tickets || result.data || [];
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      } else {
        toast.error(result.message);
        setTickets([]);
      }
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      toast.error('Erro ao carregar tickets de suporte');
      setTickets([]);
    }
    
    setLoading(false);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const validation = supportService.validateTicketData(formData);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    setSubmitting(true);
    
    try {
      const result = await supportService.createTicket(validation.data);
      
      if (result.success) {
        // Add new ticket to state
        const newTicket = result.data.ticket || result.data;
        
        if (newTicket && newTicket._id) {
          setTickets(prev => Array.isArray(prev) ? [newTicket, ...prev] : [newTicket]);
        } else {
          console.error('Invalid ticket structure:', newTicket);
          toast.error('Erro na estrutura do ticket criado');
        }
        
        // Reset form
        setFormData({
          subject: '',
          message: '',
          category: 'general',
          priority: 'medium'
        });
        setShowCreateForm(false);
        
        const protocolInfo = newTicket.protocol_number ? `Protocolo: ${newTicket.protocol_number}` : `ID: ${newTicket._id}`;
        toast.success(`Ticket criado com sucesso! ${protocolInfo}`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast.error('Erro ao criar ticket');
    }
    
    setSubmitting(false);
  };

  const handleProtocolSearch = async () => {
    if (!protocolSearch.trim()) {
      toast.error('Digite um número de protocolo');
      return;
    }

    setLoading(true);
    try {
      const result = await supportService.getTicketByProtocol(protocolSearch.trim());
      
      if (result.success) {
        const ticket = result.data.ticket || result.data;
        setTickets(ticket ? [ticket] : []);
        setFilter('all');
        setSearchTerm('');
        toast.success('Ticket encontrado!');
      } else {
        toast.error(result.message);
        setTickets([]);
      }
    } catch (error) {
      toast.error('Erro ao buscar ticket');
      setTickets([]);
    }
    setLoading(false);
  };

  const clearSearch = () => {
    setProtocolSearch('');
    setSearchTerm('');
    loadTickets();
  };

  const handleViewDetails = (ticket) => {
    const ticketId = ticket.protocol_number || ticket._id;
    navigate(`/support/ticket/${ticketId}`);
  };

  const handleAddInfo = (ticket) => {
    navigate(`/support/ticket/${ticket.protocol_number || ticket._id}`);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR');
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
      default: return status;
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
      default: return priority;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'general': return 'Geral';
      case 'technical': return 'Técnico';
      case 'billing': return 'Pagamento';
      case 'account': return 'Conta';
      default: return category;
    }
  };

  const filteredTickets = Array.isArray(tickets) ? tickets.filter(ticket => {
    const matchesFilter = filter === 'all' || ticket.status === filter;
    const matchesSearch = !searchTerm || 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) : [];

  const getFilterCounts = () => {
    if (!Array.isArray(tickets)) {
      return { all: 0, open: 0, in_progress: 0, resolved: 0 };
    }
    
    return {
      all: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length
    };
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Central de Ajuda
                </h1>
                <p className="text-gray-600">
                  Como podemos ajudar você hoje?
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Ticket
            </Button>
          </div>

          {/* Quick Help Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-800">FAQ</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Encontre respostas para as perguntas mais comuns
              </p>
              <Button variant="outline" size="sm">
                Ver FAQ
              </Button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <Mail className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-gray-800">Email</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Entre em contato diretamente por email
              </p>
              <Button variant="outline" size="sm">
                <a href="mailto:suporte@gameunite.com">Enviar Email</a>
              </Button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <Phone className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-gray-800">WhatsApp</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Suporte rápido via WhatsApp
              </p>
              <Button variant="outline" size="sm">
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                  Abrir Chat
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Protocol Search */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por protocolo (ex: SUP-2025-000123)"
                  value={protocolSearch}
                  onChange={(e) => setProtocolSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleProtocolSearch}
                  disabled={!protocolSearch.trim() || loading}
                  size="sm"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
                <Button 
                  variant="outline"
                  onClick={clearSearch}
                  size="sm"
                >
                  Limpar
                </Button>
              </div>
            </div>

            {/* General Search */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'Todos', count: counts.all },
                  { key: 'open', label: 'Abertos', count: counts.open },
                  { key: 'in_progress', label: 'Em Andamento', count: counts.in_progress },
                  { key: 'resolved', label: 'Resolvidos', count: counts.resolved }
                ].map(filterOption => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterOption.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.label} ({filterOption.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
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
                      <Badge variant={getStatusColor(ticket.status || 'open')}>
                        {getStatusLabel(ticket.status || 'open')}
                      </Badge>
                      <Badge variant={getPriorityColor(ticket.priority || 'medium')} size="sm">
                        {getPriorityLabel(ticket.priority || 'medium')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {ticket.created_at ? formatTime(ticket.created_at) : 'Data não disponível'}
                      </span>
                      {ticket.protocol_number && (
                        <span className="flex items-center font-mono">
                          <Hash className="w-4 h-4 mr-1" />
                          {ticket.protocol_number}
                        </span>
                      )}
                      <span>#{ticket._id ? ticket._id.slice(-6) : 'N/A'}</span>
                      <span>{getCategoryLabel(ticket.category || 'general')}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Content */}
                <div className="mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {ticket.message || 'Sem mensagem'}
                  </p>
                </div>

                {/* Admin Response */}
                {ticket.admin_response && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-blue-600 font-medium mb-1">
                          Resposta do Suporte
                          {ticket.resolved_at && (
                            <span className="ml-2 text-xs">
                              • {formatTime(ticket.resolved_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800">{ticket.admin_response}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ticket Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    {ticket.status === 'open' && (
                      <span className="flex items-center text-sm text-orange-600">
                        <Clock className="w-4 h-4 mr-1" />
                        Aguardando resposta
                      </span>
                    )}
                    {ticket.status === 'in_progress' && (
                      <span className="flex items-center text-sm text-blue-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Em análise
                      </span>
                    )}
                    {ticket.status === 'resolved' && (
                      <span className="flex items-center text-sm text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolvido
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(ticket)}
                    >
                      Ver Detalhes
                    </Button>
                    {ticket.status === 'open' && (
                      <Button 
                        size="sm"
                        onClick={() => handleAddInfo(ticket)}
                      >
                        Adicionar Informação
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {searchTerm ? 'Nenhum ticket encontrado' : 'Nenhum ticket ainda'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Tente ajustar sua busca ou filtros'
                  : 'Crie seu primeiro ticket de suporte'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Ticket
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Create Ticket Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Criar Novo Ticket
                  </h3>
                  <button 
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assunto *
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Descreva brevemente o problema"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoria
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="general">Geral</option>
                        <option value="technical">Técnico</option>
                        <option value="billing">Pagamento</option>
                        <option value="account">Conta</option>
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
                      Descrição *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Descreva o problema com detalhes..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="6"
                      required
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1"
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={submitting}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? 'Criando...' : 'Criar Ticket'}
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

export default Support;