import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Modal, 
  Badge, 
  LoadingSpinner, 
  Alert, 
  Pagination 
} from '../../components/Common';
import { useApi } from '../../hooks';
import GamesManagement from '../../components/Admin/GamesManagement';
import TicketsManagement from '../../components/Admin/TicketsManagement';
import UsersManagement from '../../components/Admin/UsersManagement';
import OrdersManagement from '../../components/Admin/OrdersManagement';
import AdsManagement from '../../components/Admin/AdsManagement';
import AuditLogs from '../../components/Admin/AuditLogs';
import ReportsManagement from '../../components/Admin/ReportsManagement';
import {
  Users,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Filter,
  Search,
  BarChart3,
  MessageSquare,
  Star,
  Upload,
  Image as ImageIcon,
  Tag,
  Globe,
  RefreshCw
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  
  const api = useApi();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/support/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Visão geral do sistema'
    },
    {
      id: 'tickets',
      label: 'Tickets',
      icon: MessageSquare,
      description: 'Suporte ao cliente',
      badge: stats.tickets?.open || 0
    },
    {
      id: 'games',
      label: 'Jogos',
      icon: Settings,
      description: 'Gestão de jogos'
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: Users,
      description: 'Gestão de usuários'
    },
    {
      id: 'ads',
      label: 'Anúncios',
      icon: Tag,
      description: 'Gestão de anúncios'
    },
    {
      id: 'orders',
      label: 'Pedidos',
      icon: ShoppingBag,
      description: 'Gestão de pedidos'
    },
    {
      id: 'audit',
      label: 'Auditoria',
      icon: Activity,
      description: 'Logs do sistema'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: AlertTriangle,
      description: 'Gerenciar reports de usuários',
      badge: stats.reports?.pending || 0
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Painel Administrativo
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie e monitore o GameUnite
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={loadDashboardData}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
              <Badge variant="success" className="px-3 py-1">
                Sistema Online
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <nav className="flex space-x-0 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{tab.label}</span>
                  {tab.badge > 0 && (
                    <Badge variant="danger" size="sm">
                      {tab.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'dashboard' && <DashboardTab stats={stats} setActiveTab={setActiveTab} />}
        {activeTab === 'tickets' && <TicketsTab />}
        {activeTab === 'games' && <GamesTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'ads' && <AdsTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'audit' && <AuditTab />}
        {activeTab === 'reports' && <ReportsTab />}
      </div>
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ stats, setActiveTab }) => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Usuários"
          value={stats.users?.total || 0}
          icon={Users}
          color="blue"
          subtitle={`${stats.users?.active || 0} ativos`}
        />
        <StatCard
          title="Tickets Abertos"
          value={stats.tickets?.open || 0}
          icon={AlertTriangle}
          color="red"
          subtitle={`${stats.tickets?.total || 0} total`}
        />
        <StatCard
          title="Total de Pedidos"
          value={stats.orders?.total || 0}
          icon={ShoppingBag}
          color="green"
          subtitle={`${stats.orders?.completed || 0} completos`}
        />
        <StatCard
          title="Receita Total"
          value={`R$ ${(stats.revenue?.total || 0).toFixed(2)}`}
          icon={TrendingUp}
          color="purple"
          subtitle={`${stats.orders?.completed || 0} vendas`}
        />
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Novo Jogo"
            description="Adicionar jogo à plataforma"
            icon={Plus}
            color="blue"
            onClick={() => setActiveTab('games')}
          />
          <QuickActionCard
            title="Verificar Tickets"
            description="Responder tickets pendentes"
            icon={MessageSquare}
            color="orange"
            onClick={() => window.location.href = '/admin/support'}
          />
          <QuickActionCard
            title="Ver Pedidos"
            description="Monitorar pedidos recentes"
            icon={BarChart3}
            color="green"
            onClick={() => setActiveTab('orders')}
          />
        </div>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
          <div className="space-y-4">
            {stats.tickets?.recent?.map((ticket, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{ticket.subject}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant={ticket.status === 'open' ? 'danger' : 'success'}>
                  {ticket.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Status do Sistema</h3>
          <div className="space-y-4">
            <SystemStatus label="API Backend" status="online" />
            <SystemStatus label="Base de Dados" status="online" />
            <SystemStatus label="Storage" status="online" />
            <SystemStatus label="Cache" status="warning" />
          </div>
        </Card>
      </div>
    </div>
  );
};

// Componentes auxiliares
const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    red: 'bg-red-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white'
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm mt-1 text-gray-500">
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={`text-sm mt-1 ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {trend} vs mês anterior
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    orange: 'text-orange-600 bg-orange-100',
    green: 'text-green-600 bg-green-100'
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Card>
  );
};

const SystemStatus = ({ label, status }) => {
  const statusConfig = {
    online: { color: 'bg-green-500', text: 'Online' },
    warning: { color: 'bg-yellow-500', text: 'Atenção' },
    offline: { color: 'bg-red-500', text: 'Offline' }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-gray-900">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
        <span className="text-sm text-gray-600">{config.text}</span>
      </div>
    </div>
  );
};

// Tab components
const TicketsTab = () => <TicketsManagement />;
const GamesTab = () => <GamesManagement />;
const UsersTab = () => <UsersManagement />;
const AdsTab = () => <AdsManagement />;
const OrdersTab = () => <OrdersManagement />;
const AuditTab = () => <AuditLogs />;
const ReportsTab = () => <ReportsManagement />;

export default AdminDashboard;