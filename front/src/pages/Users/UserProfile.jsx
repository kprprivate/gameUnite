import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { userService, adService } from '../../services';
import { User, Star, Calendar, MapPin, MessageCircle, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';

const UserProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);

      try {
        // Buscar perfil público do usuário
        const userResult = await userService.getUserPublicProfile(userId);
        if (userResult.success) {
          setUser(userResult.data.user);
        } else {
          toast.error(userResult.message);
        }

        // Buscar anúncios do usuário
        setAdsLoading(true);
        const adsResult = await adService.getUserAds(userId, { limit: 12 });
        if (adsResult.success) {
          setUserAds(adsResult.data.ads);
        }
        setAdsLoading(false);
      } catch (error) {
        toast.error('Erro ao carregar perfil do usuário');
      }

      setLoading(false);
    };

    fetchUserData();
  }, [userId]);

  const handleContact = () => {
    toast.info('Funcionalidade de contato em desenvolvimento');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Usuário não encontrado</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header do Perfil */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex flex-col md:flex-row items-center md:items-start">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 md:mb-0 md:mr-6">
                {user.profile_pic ? (
                  <img
                    src={user.profile_pic}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-600" />
                )}
              </div>

              <div className="text-center md:text-left text-white flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {user.first_name} {user.last_name}
                </h1>
                <p className="text-blue-100 text-lg mb-2">@{user.username}</p>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-blue-100 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  {user.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {user.location}
                    </div>
                  )}
                </div>

                {user.bio && (
                  <p className="text-blue-100 max-w-2xl">
                    {user.bio}
                  </p>
                )}
              </div>

              <div className="mt-4 md:mt-0 text-center md:text-right">
                <Button
                  onClick={handleContact}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Entrar em Contato
                </Button>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="p-6 bg-gray-50 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{user.total_ads || 0}</div>
                <div className="text-sm text-gray-600">Anúncios Publicados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{user.active_ads || 0}</div>
                <div className="text-sm text-gray-600">Anúncios Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{user.total_views || 0}</div>
                <div className="text-sm text-gray-600">Visualizações Totais</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">R$ {user.total_value || 0}</div>
                <div className="text-sm text-gray-600">Valor Total em Vendas</div>
              </div>
            </div>
          </div>

          {/* Avaliações */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Avaliações</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-green-800">Como Vendedor</div>
                  <div className="flex items-center mt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                    <span className="text-lg font-bold text-green-800">
                      {user.seller_rating?.toFixed(1) || '0.0'}/5
                    </span>
                  </div>
                </div>
                <div className="text-sm text-green-600">
                  {user.seller_ratings_count || 0} avaliações
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-blue-800">Como Comprador</div>
                  <div className="flex items-center mt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                    <span className="text-lg font-bold text-blue-800">
                      {user.buyer_rating?.toFixed(1) || '0.0'}/5
                    </span>
                  </div>
                </div>
                <div className="text-sm text-blue-600">
                  {user.buyer_ratings_count || 0} avaliações
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Anúncios do Usuário */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Anúncios de {user.first_name}
            </h2>
            <span className="text-sm text-gray-600">
              {userAds.length} anúncios
            </span>
          </div>

          {adsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : userAds.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum anúncio encontrado
              </h3>
              <p className="text-gray-600">
                Este usuário ainda não publicou nenhum anúncio.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userAds.map((ad) => (
                <Link
                  key={ad._id}
                  to={`/ads/${ad._id}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {ad.image_url && (
                    <div className="mb-3">
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 flex-1 mr-2">
                      {ad.title}
                    </h3>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ad.ad_type === 'venda' 
                          ? 'bg-green-100 text-green-800'
                          : ad.ad_type === 'troca'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {ad.ad_type}
                      </span>
                      {ad.is_boosted && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⭐
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {ad.description}
                  </p>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                      {ad.price && (
                        <span className="text-xl font-bold text-green-600">
                          R$ {ad.price}
                        </span>
                      )}
                      <span className="text-gray-500">{ad.platform}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-gray-500">
                        {new Date(ad.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {ad.view_count} views
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Ver Mais Anúncios */}
          {userAds.length >= 12 && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => toast.info('Funcionalidade de paginação em desenvolvimento')}
              >
                Ver Mais Anúncios
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;