import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner, Pagination, Modal } from '../Common';
import { useApi, useDebounce } from '../../hooks';
import { 
  Tag, 
  Package, 
  TrendingUp, 
  Search,
  Filter,
  Calendar,
  User,
  Star,
  Eye,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const AdsManagement = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const api = useApi();
  
  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    loadAds();
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  const loadAds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: debouncedSearchTerm,
        status: statusFilter
      });

      const response = await api.get(`/admin/ads?${params}`);
      if (response.success) {
        setAds(response.data.ads || []);
        setTotalPages(response.data?.total_pages || 1);
      }
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async () => {
    if (!selectedAd) return;
    
    setDeleteLoading(true);
    try {
      const response = await api.delete(`/admin/ads/${selectedAd._id}`);
      if (response.success) {
        await loadAds();
        setShowDeleteModal(false);
        setSelectedAd(null);
      }
    } catch (error) {
      console.error('Erro ao deletar anúncio:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateStatus = async (adId, newStatus) => {
    try {
      await api.put(`/admin/ads/${adId}/status`, {
        status: newStatus
      });
      await loadAds();
    } catch (error) {
      console.error('Erro ao atualizar status do anúncio:', error);
    }
  };

  const handleViewAd = (ad) => {
    // Use os dados que já temos da listagem em vez de fazer nova requisição
    setSelectedAd(ad);
    setShowAdModal(true);
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.seller?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.game?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalValue = ads.reduce((sum, ad) => sum + (ad.price || 0), 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestão de Anúncios</h2>
          <p className="text-gray-600">Monitore e gerencie anúncios da plataforma</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Anúncios"
          value={ads.length}
          icon={Tag}
          color="blue"
        />
        <StatCard
          title="Anúncios Ativos"
          value={ads.filter(a => a.status === 'active').length}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pendentes"
          value={ads.filter(a => a.status === 'pending').length}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Valor Total"
          value={`R$ ${totalValue.toFixed(2)}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar anúncios, vendedores ou jogos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="pending">Pendente</option>
              <option value="banned">Banido</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Ads Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anúncio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jogo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
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
              {filteredAds.map((ad) => (
                <AdRow 
                  key={ad._id} 
                  ad={ad} 
                  onDelete={(ad) => {
                    setSelectedAd(ad);
                    setShowDeleteModal(true);
                  }}
                  onView={() => handleViewAd(ad)}
                  onUpdateStatus={handleUpdateStatus}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="font-medium">Tem certeza que deseja deletar este anúncio?</p>
              <p className="text-sm text-gray-600">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
          {selectedAd && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{selectedAd.title}</p>
              <p className="text-sm text-gray-600">
                Vendedor: {selectedAd.seller?.username || 'N/A'}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAd}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deletando...' : 'Deletar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ad Details Modal */}
      <Modal 
        isOpen={showAdModal} 
        onClose={() => setShowAdModal(false)}
        title="Detalhes do Anúncio"
        size="lg"
      >
        {selectedAd && (
          <AdDetailsModal 
            ad={selectedAd} 
            onClose={() => setShowAdModal(false)}
          />
        )}
      </Modal>
    </div>
  );
};

// Ad Row Component
const AdRow = ({ ad, onDelete, onView, onUpdateStatus }) => {
  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      pending: 'warning',
      banned: 'danger'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      active: 'Ativo',
      inactive: 'Inativo',
      pending: 'Pendente',
      banned: 'Banido'
    };
    return texts[status] || status;
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {ad.images && ad.images.length > 0 && (
            <img 
              src={ad.images[0]} 
              alt={ad.title}
              className="w-12 h-12 object-cover rounded mr-3"
            />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">{ad.title}</div>
            <div className="text-sm text-gray-500">{ad._id.slice(-8)}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <User className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{ad.seller?.username || 'N/A'}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">{ad.game?.name || 'N/A'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">
          R$ {(ad.price || ad.price_per_hour || 0).toFixed(2)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={getStatusColor(ad.status)}>
          {getStatusText(ad.status)}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(ad.created_at).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex gap-2 justify-end">
          <Button 
            size="sm" 
            variant="outline"
            onClick={onView}
            title="Ver detalhes"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {ad.status !== 'banned' && (
            <select
              value={ad.status}
              onChange={(e) => onUpdateStatus(ad._id, e.target.value)}
              className="text-xs px-2 py-1 border border-gray-300 rounded"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="pending">Pendente</option>
              <option value="banned">Banir</option>
            </select>
          )}
          <Button 
            size="sm" 
            variant="danger"
            onClick={() => onDelete(ad)}
            title="Deletar anúncio"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    orange: 'bg-orange-500 text-white',
    purple: 'bg-purple-500 text-white'
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

// Ad Details Modal Component
const AdDetailsModal = ({ ad, onClose }) => {
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

  // Helper function to get price
  const getPrice = (ad) => {
    return ad.price || ad.price_per_hour || 0;
  };

  return (
    <div className="space-y-6">
      {/* Ad Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{ad.title || 'Título não disponível'}</h3>
          <Badge variant={getStatusColor(ad.status)}>
            {getStatusText(ad.status)}
          </Badge>
        </div>
        <p className="text-gray-600">
          Criado em {formatDate(ad.created_at)}
        </p>
      </div>

      {/* Ad Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Informações do Anúncio</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Preço:</strong> R$ {getPrice(ad).toFixed(2)}</p>
            <p><strong>Jogo:</strong> {ad.game?.name || 'N/A'}</p>
            <p><strong>Plataforma:</strong> {ad.platform || 'N/A'}</p>
            <p><strong>Tipo:</strong> {ad.ad_type || 'N/A'}</p>
            <p><strong>Condição:</strong> {ad.condition || 'N/A'}</p>
            <p><strong>ID:</strong> {ad._id}</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Vendedor</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Username:</strong> {ad.seller?.username || 'N/A'}</p>
            <p><strong>Email:</strong> {ad.seller?.email || 'N/A'}</p>
            <p><strong>ID:</strong> {ad.seller_id}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Descrição</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm">{ad.description || 'Sem descrição'}</p>
        </div>
      </div>

      {/* Images */}
      {ad.images && ad.images.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Imagens</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {ad.images.map((image, index) => (
              <img 
                key={index}
                src={image} 
                alt={`${ad.title} ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
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
    active: 'success',
    inactive: 'default',
    pending: 'warning',
    banned: 'danger'
  };
  return colors[status] || 'default';
};

const getStatusText = (status) => {
  const texts = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    banned: 'Banido'
  };
  return texts[status] || status;
};

export default AdsManagement;