import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderService } from '../../services/orderService';
import {
  ShoppingBag,
  DollarSign,
  Filter,
  Grid,
  List,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye
} from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import EmptyState from '../../components/Common/EmptyState';

const Orders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [activeTab]);

  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchOrders = async () => {
    setLoading(true);

    try {
      let result;
      if (activeTab === 'sales') {
        result = await orderService.getSales();
      } else if (activeTab === 'purchases') {
        result = await orderService.getPurchases();
      } else {
        result = await orderService.getOrders();
      }

      if (result.success) {
        setOrders(result.data.orders || result.data.sales || result.data.purchases || []);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao carregar pedidos');
    }

    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const result = await orderService.getOrderStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      paid: CheckCircle,
      shipped: Package,
      delivered: CheckCircle,
      cancelled: XCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendente',
      paid: 'Pago',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  const getRoleLabel = (role) => {
    return role === 'buyer' ? 'Compra' : 'Venda';
  };

  const getRoleIcon = (role) => {
    return role === 'buyer' ? TrendingDown : TrendingUp;
  };

  const getRoleColor = (role) => {
    return role === 'buyer'
      ? 'bg-blue-100 text-blue-800 border-blue-200'
      : 'bg-green-100 text-green-800 border-green-200';
  };

  const tabs = [
    {
      id: 'all',
      label: 'Todos',
      icon: ShoppingBag,
      description: 'Todas as transações'
    },
    {
      id: 'purchases',
      label: 'Minhas Compras',
      icon: TrendingDown,
      description: 'Itens que você comprou'
    },
    {
      id: 'sales',
      label: 'Minhas Vendas',
      icon: TrendingUp,
      description: 'Itens que você vendeu'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Meus Pedidos
          </h1>
          <p className="text-gray-600">
            Acompanhe suas compras e vendas na plataforma
          </p>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingDown className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Compras</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.buyer_stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Vendas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.seller_stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Gasto Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {stats.total_spent.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    R$ {stats.total_revenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs e Filtros */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          {/* Tabs melhoradas */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-6 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold">{tab.label}</span>
                      <span className="text-xs text-gray-500 font-normal">{tab.description}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Controles */}
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
                </span>
                {activeTab !== 'all' && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {activeTab === 'purchases' ? 'Suas Compras' : 'Suas Vendas'}
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Filtro por status */}
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos os status</option>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregue</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>

                {/* Modo de visualização */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${
                      viewMode === 'list'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Visualização em lista"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${
                      viewMode === 'grid'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Visualização em grade"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Pedidos */}
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Nenhum pedido encontrado"
            description={
              activeTab === 'sales'
                ? 'Quando alguém comprar seus anúncios, os pedidos aparecerão aqui.'
                : activeTab === 'purchases'
                ? 'Quando você fizer uma compra, ela aparecerá aqui.'
                : 'Você ainda não tem nenhum pedido.'
            }
            actionText="Explorar Jogos"
            onAction={() => window.location.href = '/games'}
          />
        ) : viewMode === 'grid' ? (
          // Grid View Melhorada
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => {
              const RoleIcon = getRoleIcon(order.role);
              return (
                <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Header com tipo e status */}
                    <div className="flex justify-between items-start mb-4">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getRoleColor(order.role)}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />
                        {getRoleLabel(order.role)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusLabel(order.status)}</span>
                      </span>
                    </div>

                    {/* Título e jogo */}
                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 mb-2">
                      {order.ad_snapshot?.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {order.ad_snapshot?.game_name}
                    </p>

                    {/* Detalhes */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {order.role === 'buyer' ? 'Vendedor:' : 'Comprador:'}
                        </span>
                        <span className="font-medium text-right">
                          {order.other_user?.first_name} {order.other_user?.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Quantidade:</span>
                        <span className="font-medium">{order.quantity}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold text-green-600">R$ {order.total_price?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Data:</span>
                        <span className="font-medium">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <Link to={`/orders/${order._id}`}>
                      <Button className="w-full inline-flex items-center justify-center" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View Melhorada
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const RoleIcon = getRoleIcon(order.role);
                    return (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {order.ad_snapshot?.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.ad_snapshot?.game_name} • Qtd: {order.quantity}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getRoleColor(order.role)}`}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {getRoleLabel(order.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {order.other_user?.first_name} {order.other_user?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{order.other_user?.username}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          R$ {order.total_price?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{getStatusLabel(order.status)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/orders/${order._id}`}
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalhes
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;