// front/src/pages/Dashboard/Dashboard.jsx - VERSÃO COMPLETA
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { userService, adService, orderService } from '../../services';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Star,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle
} from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import MyQuestions from '../../components/Dashboard/MyQuestions';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Tabs disponíveis
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
    { id: 'ads', label: 'Meus Anúncios', icon: Package },
    { id: 'questions', label: 'Perguntas', icon: MessageCircle },
    { id: 'sales', label: 'Vendas', icon: DollarSign },
    { id: 'purchases', label: 'Compras', icon: ShoppingBag },
    { id: 'profile', label: 'Perfil', icon: Users }
  ];

  useEffect(() => {
    // Verificar se há uma tab específica na URL
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'ads') {
      fetchUserAds();
    } else if (activeTab === 'sales' || activeTab === 'purchases') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // Buscar dados do dashboard
      const dashboardResult = await userService.getDashboardData();
      if (dashboardResult.success) {
        setDashboardData(dashboardResult.data);
      }

      // Buscar estatísticas de pedidos
      const statsResult = await orderService.getOrderStats();
      if (statsResult.success) {
        setOrderStats(statsResult.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
    }

    setLoading(false);
  };

  const fetchUserAds = async () => {
    setAdsLoading(true);
    const result = await adService.getMyAds();
    if (result.success) {
      setUserAds(result.data.ads);
    }
    setAdsLoading(false);
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);

    try {
      let result;
      if (activeTab === 'sales') {
        result = await orderService.getSales();
      } else {
        result = await orderService.getPurchases();
      }

      if (result.success) {
        setOrders(result.data.sales || result.data.purchases || []);
      }
    } catch (error) {
      toast.error('Erro ao carregar pedidos');
    }

    setOrdersLoading(false);
  };

  const handleEditAd = (adId) => {
    navigate(`/ads/${adId}/edit`);
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm('Tem certeza que deseja excluir este anúncio?')) {
      setAdsLoading(true);

      const result = await adService.deleteAd(adId);
      if (result.success) {
        toast.success('Anúncio excluído com sucesso!');
        setUserAds(userAds.filter(ad => ad._id !== adId));
        fetchDashboardData(); // Atualizar estatísticas
      } else {
        toast.error(result.message);
      }

      setAdsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Anúncios Ativos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.stats?.active_ads || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Vendas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {orderStats?.seller_stats?.delivered || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <ShoppingBag className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Compras</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {orderStats?.buyer_stats?.delivered || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <Eye className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Visualizações</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData?.stats?.total_views || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/create-ad">
                  <Button className="w-full flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Novo Anúncio
                  </Button>
                </Link>
                <Link to="/orders">
                  <Button variant="outline" className="w-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Ver Todos os Pedidos
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="outline" className="w-full flex items-center justify-center">
                    <Users className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Button>
                </Link>
              </div>
            </div>

            {/* Resumo financeiro */}
            {orderStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    💰 Como Vendedor
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de Vendas:</span>
                      <span className="font-medium">R$ {orderStats.total_revenue?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pedidos Pendentes:</span>
                      <span className="font-medium">{orderStats.seller_stats?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pedidos Entregues:</span>
                      <span className="font-medium">{orderStats.seller_stats?.delivered || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    🛒 Como Comprador
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Gasto:</span>
                      <span className="font-medium">R$ {orderStats.total_spent?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pedidos Pendentes:</span>
                      <span className="font-medium">{orderStats.buyer_stats?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pedidos Recebidos:</span>
                      <span className="font-medium">{orderStats.buyer_stats?.delivered || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'ads':
        return (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Meus Anúncios</h2>
                <Link to="/create-ad">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Anúncio
                  </Button>
                </Link>
              </div>
            </div>

            {adsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : userAds.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum anúncio encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece criando seu primeiro anúncio para vender jogos.
                </p>
                <Link to="/create-ad">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Anúncio
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Anúncio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Preço
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userAds.map((ad) => (
                      <tr key={ad._id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {ad.image_url && (
                              <img
                                src={ad.image_url}
                                alt={ad.title}
                                className="w-12 h-12 rounded object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {ad.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ad.game?.name} • {ad.platform}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            ad.ad_type === 'venda' 
                              ? 'bg-green-100 text-green-800'
                              : ad.ad_type === 'troca'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {ad.ad_type.charAt(0).toUpperCase() + ad.ad_type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ad.price ? `R$ ${ad.price}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            ad.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {ad.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ad.view_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              to={`/ads/${ad._id}`}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver anúncio"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Editar anúncio"
                              onClick={() => handleEditAd(ad._id)}
                              disabled={adsLoading}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-900"
                              title="Excluir anúncio"
                              onClick={() => handleDeleteAd(ad._id)}
                              disabled={adsLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'sales':
      case 'purchases':
        const isSellerView = activeTab === 'sales';
        return (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {isSellerView ? 'Minhas Vendas' : 'Minhas Compras'}
              </h2>
              <p className="text-gray-600 mt-1">
                {isSellerView
                  ? 'Pedidos onde você é o vendedor'
                  : 'Pedidos onde você é o comprador'
                }
              </p>
            </div>

            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum {isSellerView ? 'venda' : 'compra'} encontrada
                </h3>
                <p className="text-gray-600">
                  {isSellerView
                    ? 'Quando alguém comprar seus anúncios, eles aparecerão aqui.'
                    : 'Quando você fizer uma compra, ela aparecerá aqui.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pedido
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {isSellerView ? 'Comprador' : 'Vendedor'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.ad_snapshot?.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.ad_snapshot?.game_name} • Qtd: {order.quantity}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {order.other_user?.first_name} {order.other_user?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{order.other_user?.username}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          R$ {order.total_price?.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/orders/${order._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver Detalhes
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'questions':
        return <MyQuestions />;

      case 'profile':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Configurações do Perfil</h2>
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Configure suas informações pessoais e preferências.
              </p>
              <Link to="/profile">
                <Button>
                  <Users className="w-4 h-4 mr-2" />
                  Ir para Perfil Completo
                </Button>
              </Link>
            </div>
          </div>
        );

      default:
        return <div>Tab não encontrada</div>;
    }
  };

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
            Dashboard
          </h1>
          <p className="text-gray-600">
            Olá, {dashboardData?.user?.first_name || user?.username}! Gerencie seus anúncios e pedidos
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;