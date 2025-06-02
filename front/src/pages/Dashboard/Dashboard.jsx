import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { userService, adService } from '../../services';
import { Plus, Eye, Edit, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        // Buscar dados do dashboard
        const dashboardResult = await userService.getDashboardData();
        if (dashboardResult.success) {
          setDashboardData(dashboardResult.data);
        }

        // Buscar anúncios do usuário
        const adsResult = await adService.getMyAds();
        if (adsResult.success) {
          setUserAds(adsResult.data.ads);
        }
      } catch (error) {
        toast.error('Erro ao carregar dados do dashboard');
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const handleEditAd = (adId) => {
    navigate(`/ads/${adId}/edit`);
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm('Tem certeza que deseja excluir este anúncio?')) {
      setAdsLoading(true);

      const result = await adService.deleteAd(adId);
      if (result.success) {
        toast.success('Anúncio excluído com sucesso!');
        // Remover o anúncio da lista
        setUserAds(userAds.filter(ad => ad._id !== adId));

        // Atualizar dados do dashboard
        const dashboardResult = await userService.getDashboardData();
        if (dashboardResult.success) {
          setDashboardData(dashboardResult.data);
        }
      } else {
        toast.error(result.message);
      }

      setAdsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = dashboardData?.stats || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Olá, {dashboardData?.user?.first_name || user?.username}! Gerencie seus anúncios e acompanhe suas vendas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Anúncios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_ads || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Anúncios Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_ads || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_views || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">R$ {stats.total_value || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/create-ad">
              <Button className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Anúncio
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline">
                Editar Perfil
              </Button>
            </Link>
          </div>
        </div>

        {/* User Ads */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Meus Anúncios</h2>
            <Link to="/create-ad">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Novo Anúncio
              </Button>
            </Link>
          </div>

          {adsLoading && (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          )}

          {userAds.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum anúncio encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Comece criando seu primeiro anúncio para vender ou trocar jogos.
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
                      Jogo
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
                    <tr key={ad._id} className={adsLoading ? 'opacity-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {ad.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ad.description.substring(0, 50)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ad.game?.name || 'Jogo não encontrado'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {ad.platform}
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
      </div>
    </div>
  );
};

export default Dashboard;