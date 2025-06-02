import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { gameService, adService } from '../../services';
import { Gamepad, Star, Plus, Filter } from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';

const GameDetails = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adTypeFilter, setAdTypeFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('asc');

  useEffect(() => {
    const fetchGameDetails = async () => {
      setLoading(true);

      const gameResult = await gameService.getGame(gameId);
      if (gameResult.success) {
        setGame(gameResult.data.game);
      } else {
        toast.error(gameResult.message);
      }

      setLoading(false);
    };

    const fetchGameAds = async () => {
      setAdsLoading(true);

      const adsResult = await adService.getAds({ game_id: gameId });
      if (adsResult.success) {
        setAds(adsResult.data.ads);
      } else {
        toast.error(adsResult.message);
      }

      setAdsLoading(false);
    };

    fetchGameDetails();
    fetchGameAds();
  }, [gameId]);

  const filteredAndSortedAds = ads
    .filter(ad => adTypeFilter === 'all' || ad.ad_type === adTypeFilter)
    .sort((a, b) => {
      if (priceSort === 'asc') {
        return (a.price || 0) - (b.price || 0);
      } else {
        return (b.price || 0) - (a.price || 0);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Jogo não encontrado</h2>
          <Link to="/games" className="text-blue-600 hover:text-blue-800">
            Voltar para catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Game Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:flex-shrink-0">
              <div className="h-48 w-full md:h-full md:w-48 bg-gray-200 flex items-center justify-center">
                {game.image_url ? (
                  <img
                    src={game.image_url}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Gamepad className="w-16 h-16 text-gray-400" />
                )}
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800 mr-4">
                  {game.name}
                </h1>
                {game.is_featured && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-current" />
                    Destaque
                  </span>
                )}
              </div>

              {game.description && (
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {game.description}
                </p>
              )}

              <div className="flex flex-wrap gap-4">
                <Link to={`/create-ad?game=${gameId}`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Anúncio para este Jogo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Ads Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Anúncios para {game.name} ({filteredAndSortedAds.length})
            </h2>
            <div className="flex space-x-4">
              <select
                value={adTypeFilter}
                onChange={(e) => setAdTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os tipos</option>
                <option value="venda">Venda</option>
                <option value="troca">Troca</option>
                <option value="procura">Procura</option>
              </select>
              <select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="asc">Menor preço</option>
                <option value="desc">Maior preço</option>
              </select>
            </div>
          </div>

          {adsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredAndSortedAds.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <Gamepad className="w-16 h-16 text-gray-300 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum anúncio encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                {ads.length === 0
                  ? 'Seja o primeiro a criar um anúncio para este jogo!'
                  : 'Nenhum anúncio corresponde aos filtros selecionados.'
                }
              </p>
              <Link to={`/create-ad?game=${gameId}`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Anúncio
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedAds.map((ad) => (
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
        </div>
      </div>
    </div>
  );
};

export default GameDetails;