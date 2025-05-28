import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGames } from '../../contexts/GameContext';
import { Search, Filter, Gamepad } from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';

const Games = () => {
  const { games, loading, fetchGames } = useGames();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredGames, setFilteredGames] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (games.length === 0) {
      fetchGames();
    }
  }, [games, fetchGames]);

  useEffect(() => {
    const filtered = games.filter(game =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredGames(filtered);
  }, [games, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchGames({ search: searchTerm });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Catálogo de Jogos
          </h1>
          <p className="text-gray-600">
            Explore nossa biblioteca de jogos e encontre anúncios de compra, venda e troca
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar jogos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button type="submit">
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gênero
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Todos os gêneros</option>
                    <option value="action">Ação</option>
                    <option value="adventure">Aventura</option>
                    <option value="rpg">RPG</option>
                    <option value="sports">Esportes</option>
                    <option value="racing">Corrida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plataforma
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Todas as plataformas</option>
                    <option value="pc">PC</option>
                    <option value="ps5">PlayStation 5</option>
                    <option value="ps4">PlayStation 4</option>
                    <option value="xbox">Xbox</option>
                    <option value="switch">Nintendo Switch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="name">Nome</option>
                    <option value="popularity">Popularidade</option>
                    <option value="newest">Mais recentes</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-12">
            <Gamepad className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum jogo encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termo de busca
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <Link
                key={game._id}
                to={`/games/${game._id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-48 bg-gray-200 flex items-center justify-center">
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
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">
                    {game.name}
                  </h3>
                  {game.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {game.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-600 font-medium">
                      Ver anúncios
                    </span>
                    {game.is_featured && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        ⭐ Destaque
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredGames.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <Button variant="outline" disabled>
                Anterior
              </Button>
              <Button>1</Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">3</Button>
              <Button variant="outline">
                Próximo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;