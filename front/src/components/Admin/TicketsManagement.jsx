import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Modal, 
  Badge, 
  LoadingSpinner, 
  Alert, 
  Pagination,
  SafeImage 
} from '../Common';
import { useApi, useDebounce } from '../../hooks';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Search,
  Filter
} from 'lucide-react';

const TicketsManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const api = useApi();
  
  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setCurrentPage(1); // Reset page when filters change
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    loadTickets();
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/support/admin/tickets', {
        params: {
          page: currentPage,
          limit: 20,
          search: debouncedSearchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });
      
      if (response.success) {
        setTickets(response.data.tickets || []);
        setTotalPages(response.data.total_pages || 1);
        setTotalTickets(response.data.total || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      setTickets([]);
      setTotalPages(1);
      setTotalTickets(0);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketResponse = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: 'danger',
      in_progress: 'warning', 
      resolved: 'success',
      closed: 'secondary'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tickets de Suporte</h2>
          <p className="text-gray-600">Gerencie e responda tickets dos usuários</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="open">Abertos</option>
            <option value="in_progress">Em Progresso</option>
            <option value="resolved">Resolvidos</option>
            <option value="closed">Fechados</option>
          </select>
        </div>
      </Card>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ticket encontrado</h3>
          <p className="text-gray-600">Não há tickets de suporte no momento</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket._id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                    {getStatusBadge(ticket.status)}
                    <Badge variant="secondary">{ticket.priority}</Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{ticket.message}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {ticket.user?.profile_pic ? (
                        <SafeImage
                          src={ticket.user.profile_pic}
                          alt={ticket.user.username}
                          type="user"
                          size="thumbnail"
                          className="w-6 h-6 rounded-full object-cover"
                          fallbackIcon={<User className="w-4 h-4" />}
                        />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      {ticket.user?.username || 'Usuário'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(ticket.created_at).toLocaleString()}
                    </div>
                    <div>Categoria: {ticket.category}</div>
                  </div>

                  {ticket.admin_response && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Resposta do Suporte:</h4>
                      <p className="text-blue-800 text-sm">{ticket.admin_response}</p>
                    </div>
                  )}
                </div>
                
                <div className="ml-4">
                  <Button
                    onClick={() => handleTicketResponse(ticket)}
                    size="sm"
                    variant={ticket.status === 'open' ? 'primary' : 'outline'}
                  >
                    {ticket.admin_response ? 'Atualizar' : 'Responder'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {showModal && selectedTicket && (
        <TicketResponseModal
          ticket={selectedTicket}
          onClose={() => setShowModal(false)}
          onSave={loadTickets}
        />
      )}
    </div>
  );
};

const TicketResponseModal = ({ ticket, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    status: ticket.status || 'open',
    admin_response: ticket.admin_response || '',
    priority: ticket.priority || 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const api = useApi();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.put(`/support/admin/tickets/${ticket._id}`, formData);
      onSave();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao atualizar ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={true}
      onClose={onClose} 
      title="Responder Ticket"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} className="mb-4" />}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="open">Aberto</option>
              <option value="in_progress">Em Progresso</option>
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
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resposta
            </label>
            <textarea
              value={formData.admin_response}
              onChange={(e) => setFormData({ ...formData, admin_response: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite sua resposta ao usuário..."
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Resposta'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TicketsManagement;