// front/src/pages/Favorites/Favorites.jsx - PÁGINA COMPLETA DE FAVORITOS
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { favoritesService } from '../../services/favoritesService';
import { Heart, Trash2, Eye, Filter, Grid, List, Calendar, MapPin } from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import EmptyState from '../../components/Common/EmptyState';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filter, setFilter] = useState('all'); // 'all', 'venda', 'troca', 'procura'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'price_asc', 'price_desc', 'title'

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    const result = await favoritesService.getFavorites();
    if (result.success) {
      setFavorites(result.data.favorites || []);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleRemoveFavorite = async (adId) => {
    if (window.confirm('Tem certeza que deseja remover este anúncio dos favoritos?')) {
      setRemoving(prev => ({ ...prev, [adId]: true }));

      const result = await favoritesService.removeFromFavorites(adId);
      if (result.success) {
        setFavorites(favorites.filter(fav => fav.ad._id !== adId));
        toast.success('Anúncio removido dos favoritos');
      } else {
        toast.error(result.message);
      }

      setRemoving(prev => ({ ...prev, [adId]: false }));
    }
  };

  const filteredAndSortedFavorites = favorites
    .filter(fav => {
      if (filter === 'all') return true;
      return fav.ad.ad_type === filter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.ad.price || 0) - (b.ad.price || 0);
        case 'price_desc':
          return (b.ad.price || 0) - (a.ad.price || 0);
        case 'title':
          return a.ad.title.localeCompare(b.ad.title);
        case 'recent':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

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
            Meus Favoritos
          </h1>
          <p className="text-gray-600">
            Anúncios que você salvou para acompanhar
          </p>
        </div>

        {favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nenhum favorito encontrado"
            description="Você ainda não favoritou nenhum anúncio. Explore jogos e salve os que mais te interessam!"
            actionText="Explorar Jogos"
            onAction={() => window.location.href = '/games'}
          />
        ) : (
          <>
            {/* Controls */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">
                    {filteredAndSortedFavorites.length} {filteredAndSortedFavorites.length === 1 ? 'favorito' : 'favoritos'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Filters */}
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos os tipos</option>
                      <option value="venda">Venda</option>
                      <option value="troca">Troca</option>
                      <option value="procura">Procura</option>
                    </select>
                  </div>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="recent">Mais recentes</option>
                    <option value="title">Nome A-Z</option>
                    <option value="price_asc">Menor preço</option>
                    <option value="price_desc">Maior preço</option>
                  </select>

                  {/* View Mode */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${
                        viewMode === 'grid'
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${
                        viewMode === 'list'
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Favorites Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedFavorites.map((favorite) => (
                  <div
                    key={favorite._id}
                    className={`bg-white rounded-lg shadow-md overflow-hidden ${
                      removing[favorite.ad._id] ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Image */}
                    {favorite.ad.image_url && (
                      <div className="h-48 bg-gray-200">
                        <img
                          src={favorite.ad.image_url}
                          alt={favorite.ad.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-800 line-clamp-2 mb-1">
                            {favorite.ad.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {favorite.ad.game?.name}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1 ml-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            favorite.ad.ad_type === 'venda' 
                              ? 'bg-green-100 text-green-800'
                              : favorite.ad.ad_type === 'troca'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {favorite.ad.ad_type}
                          </span>
                          {favorite.ad.is_boosted && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⭐
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {favorite.ad.description}
                      </p>

                      {/* Price and Platform */}
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          {favorite.ad.price && (
                            <span className="text-lg font-bold text-green-600">
                              R$ {favorite.ad.price}
                            </span>
                          )}
                          <p className="text-sm text-gray-500">{favorite.ad.platform}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            Favoritado em {new Date(favorite.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Link
                          to={`/ads/${favorite.ad._id}`}
                          className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Anúncio
                        </Link>
                        <button
                          onClick={() => handleRemoveFavorite(favorite.ad._id)}
                          disabled={removing[favorite.ad._id]}
                          className="bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                          Favoritado em
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedFavorites.map((favorite) => (
                        <tr key={favorite._id} className={removing[favorite.ad._id] ? 'opacity-50' : ''}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {favorite.ad.image_url && (
                                <img
                                  src={favorite.ad.image_url}
                                  alt={favorite.ad.title}
                                  className="w-12 h-12 rounded object-cover mr-4"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {favorite.ad.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {favorite.ad.game?.name} • {favorite.ad.platform}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              favorite.ad.ad_type === 'venda' 
                                ? 'bg-green-100 text-green-800'
                                : favorite.ad.ad_type === 'troca'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {favorite.ad.ad_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {favorite.ad.price ? `R$ ${favorite.ad.price}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(favorite.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Link
                                to={`/ads/${favorite.ad._id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleRemoveFavorite(favorite.ad._id)}
                                disabled={removing[favorite.ad._id]}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Favorites;