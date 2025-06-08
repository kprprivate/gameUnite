import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, LoadingSpinner, Pagination, Modal } from '../Common';
import { useApi } from '../../hooks';
import { 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Search,
  Filter,
  Calendar,
  User,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const api = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, [currentPage, searchTerm, statusFilter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/support/admin/orders', {
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });
      
      if (response.success) {
        setOrders(response.data?.orders || []);
        setTotalPages(response.data?.total_pages || 1);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/support/admin/orders/${orderId}`, {
        status: newStatus
      });
      await loadOrders();
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
    }
  };

  const handleViewOrderDetails = async (orderId) => {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      if (response.success) {
        setSelectedOrder(response.data);
        setShowOrderModal(true);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do pedido:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order._id.includes(searchTerm) ||
                         order.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.seller_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = orders.reduce((sum, order) => 
    order.status === 'completed' ? sum + (order.total_price || 0) : sum, 0
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestão de Pedidos</h2>
          <p className="text-gray-600">Monitore e gerencie pedidos da plataforma</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Pedidos"
          value={orders.length}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title="Pedidos Completos"
          value={orders.filter(o => o.status === 'completed').length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pendentes"
          value={orders.filter(o => o.status === 'pending').length}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Receita Total"
          value={`R$ ${totalRevenue.toFixed(2)}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregue</option>
              <option value="completed">Completo</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comprador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <OrderRow 
                  key={order._id} 
                  order={order} 
                  onUpdateStatus={handleUpdateOrderStatus}
                  onViewDetails={handleViewOrderDetails}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Order Details Modal */}
      <Modal 
        isOpen={showOrderModal} 
        onClose={() => setShowOrderModal(false)}
        title="Detalhes do Pedido"
        size="lg"
      >
        {selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={() => setShowOrderModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

// Order Row Component
const OrderRow = ({ order, onUpdateStatus, onViewDetails }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      shipped: 'default',
      delivered: 'success',
      completed: 'success',
      cancelled: 'danger'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregue',
      completed: 'Completo',
      cancelled: 'Cancelado'
    };
    return texts[status] || status;
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">#{order._id.slice(-8)}</div>
          <div className="text-sm text-gray-500">{order.ad_title || 'N/A'}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <User className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{order.buyer_name || 'N/A'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <User className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{order.seller_name || 'N/A'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">
          R$ {(order.total_price || 0).toFixed(2)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={getStatusColor(order.status)}>
          {getStatusText(order.status)}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(order.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex gap-2 justify-end">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onViewDetails(order._id)}
            title="Ver detalhes do pedido"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <select
              value={order.status}
              onChange={(e) => onUpdateStatus(order._id, e.target.value)}
              className="text-xs px-2 py-1 border border-gray-300 rounded"
            >
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregue</option>
              <option value="completed">Completo</option>
              <option value="cancelled">Cancelado</option>
            </select>
          )}
        </div>
      </td>
    </tr>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    purple: 'text-purple-600 bg-purple-100'
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose }) => {
  // Helper function to format date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Data não disponível';
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Helper function to get user display name
  const getUserDisplayName = (user) => {
    if (!user) return 'N/A';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username || 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Pedido #{order._id?.slice(-8)}</h3>
          <Badge variant={getStatusColor(order.status)}>
            {getStatusText(order.status)}
          </Badge>
        </div>
        <p className="text-gray-600">
          Criado em {formatDate(order.created_at)}
        </p>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Informações do Comprador</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Nome:</strong> {getUserDisplayName(order.buyer)}</p>
            <p><strong>Email:</strong> {order.buyer?.email || 'N/A'}</p>
            <p><strong>Username:</strong> {order.buyer?.username || 'N/A'}</p>
            <p><strong>ID:</strong> {order.buyer_id}</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Informações do Vendedor</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Nome:</strong> {getUserDisplayName(order.seller)}</p>
            <p><strong>Email:</strong> {order.seller?.email || 'N/A'}</p>
            <p><strong>Username:</strong> {order.seller?.username || 'N/A'}</p>
            <p><strong>ID:</strong> {order.seller_id}</p>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Produto</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            {(order.ad?.image_url || order.ad?.images?.[0]) && (
              <img 
                src={order.ad?.image_url || order.ad?.images?.[0]} 
                alt={order.ad?.title || 'Produto'}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h5 className="font-medium">{order.ad?.title || order.ad_title || 'Produto não identificado'}</h5>
              <p className="text-sm text-gray-600">{order.ad?.description || order.ad_description || 'Sem descrição'}</p>
              <p className="text-sm text-gray-500">Jogo: {order.ad?.game?.name || 'N/A'}</p>
              <p className="text-lg font-bold text-green-600 mt-2">
                R$ {(order.total_price || order.price || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      {order.status_history && order.status_history.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Histórico do Pedido</h4>
          <div className="space-y-3">
            {order.status_history.map((history, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium">{getStatusText(history.status)}</p>
                  <p className="text-gray-600">
                    {new Date(history.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onClose} variant="outline">
          Fechar
        </Button>
      </div>
    </div>
  );
};

// Helper functions for the modal
const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    confirmed: 'info', 
    shipped: 'default',
    delivered: 'success',
    completed: 'success',
    cancelled: 'danger'
  };
  return colors[status] || 'default';
};

const getStatusText = (status) => {
  const texts = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    shipped: 'Enviado',
    delivered: 'Entregue',
    completed: 'Completo',
    cancelled: 'Cancelado'
  };
  return texts[status] || status;
};

export default OrdersManagement;