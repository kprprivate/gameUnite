import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner, Pagination, SafeImage } from '../Common';
import UserEditModal from './UserEditModal';
import { useApi } from '../../hooks';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Activity,
  Search,
  Filter,
  Shield,
  Mail,
  Calendar,
  MoreVertical,
  Edit3,
  Eye
} from 'lucide-react';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const api = useApi();

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/support/admin/users', {
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });
      
      if (response.success) {
        setUsers(response.data?.users || []);
        setTotalPages(response.data?.total_pages || 1);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/support/admin/users/${userId}`, {
        is_active: !currentStatus
      });
      await loadUsers();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUserUpdated = (updatedUser) => {
    setUsers(prev => prev.map(user => 
      user._id === updatedUser._id ? updatedUser : user
    ));
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active) ||
                         (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestão de Usuários</h2>
          <p className="text-gray-600">Gerencie usuários, permissões e atividades</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Usuários"
          value={users.length}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Usuários Ativos"
          value={users.filter(u => u.is_active).length}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Administradores"
          value={users.filter(u => u.role === 'admin').length}
          icon={Shield}
          color="purple"
        />
        <StatCard
          title="Usuários Hoje"
          value={users.filter(u => {
            const today = new Date().toDateString();
            return new Date(u.created_at).toDateString() === today;
          }).length}
          icon={Activity}
          color="orange"
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
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas as Funções</option>
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
              <option value="support">Suporte</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <UserRow 
                  key={user._id} 
                  user={user} 
                  onToggleStatus={handleToggleUserStatus}
                  onEdit={handleEditUser}
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

      {/* Edit User Modal */}
      <UserEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};

// User Row Component
const UserRow = ({ user, onToggleStatus, onEdit }) => {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <SafeImage
              src={user.profile_pic || user.profile_image}
              alt={user.username}
              type="user"
              size="thumbnail"
              className="h-10 w-10 rounded-full object-cover"
              fallbackIcon={<Users className="w-6 h-6 text-gray-400" />}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.username}</div>
            <div className="text-sm text-gray-500">ID: {user._id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Mail className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{user.email || 'N/A'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge 
          variant={user.role === 'admin' ? 'danger' : user.role === 'support' ? 'warning' : 'default'}
        >
          {user.role}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={user.is_active ? 'success' : 'danger'}>
          {user.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(user.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(user)}
            title="Editar usuário"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={user.is_active ? "outline" : "default"}
            onClick={() => onToggleStatus(user._id, user.is_active)}
          >
            {user.is_active ? 'Desativar' : 'Ativar'}
          </Button>
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
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
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

export default UsersManagement;