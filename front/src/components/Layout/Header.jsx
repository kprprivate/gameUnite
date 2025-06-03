import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGames } from '../../contexts/GameContext';
import { useDebounce } from '../../hooks';
import {
  User,
  LogOut,
  Plus,
  Search,
  Menu,
  X,
  Heart,
  Settings,
  BarChart3
} from 'lucide-react';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { fetchGames } = useGames();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchRef = useRef(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      handleSearch(debouncedSearch);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearch]);

  // Fechar dropdown de busca quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async (term) => {
    setSearchLoading(true);
    try {
      const result = await fetchGames({ search: term, limit: 5 });
      if (result.success) {
        setSearchResults(result.data.games || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleSearchSelect = (gameId) => {
    setSearchTerm('');
    setShowSearchResults(false);
    setIsMenuOpen(false);
    navigate(`/games/${gameId}`);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-md relative z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-blue-600" onClick={closeMenu}>
              GameUnite
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8" ref={searchRef}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar jogos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                />

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                    {searchLoading ? (
                      <div className="p-4 text-center text-gray-500">Buscando...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((game) => (
                        <button
                          key={game._id}
                          className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                          onClick={() => handleSearchSelect(game._id)}
                        >
                          <div className="flex items-center">
                            {game.image_url && (
                              <img
                                src={game.image_url}
                                alt={game.name}
                                className="w-10 h-10 rounded object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-800">{game.name}</div>
                              {game.description && (
                                <div className="text-sm text-gray-600 truncate">
                                  {game.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Nenhum jogo encontrado
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/games" className="text-gray-700 hover:text-blue-600 transition-colors">
                Jogos
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/create-ad"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Anúncio
                  </Link>

                  <Link
                    to="/favorites"
                    className="text-gray-700 hover:text-blue-600 transition-colors flex items-center"
                  >
                    <Heart className="w-5 h-5 mr-1" />
                    Favoritos
                  </Link>

                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-blue-600 transition-colors flex items-center"
                  >
                    <BarChart3 className="w-5 h-5 mr-1" />
                    Dashboard
                  </Link>

                  <div className="relative group">
                    <button className="flex items-center text-gray-700 hover:text-blue-600 transition-colors">
                      <User className="w-5 h-5 mr-1" />
                      Perfil
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Meu Perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sair
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Cadastrar
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors focus:outline-none"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden mt-4" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar jogos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
              />

              {/* Mobile Search Results */}
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                  {searchLoading ? (
                    <div className="p-4 text-center text-gray-500">Buscando...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((game) => (
                      <button
                        key={game._id}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                        onClick={() => handleSearchSelect(game._id)}
                      >
                        <div className="flex items-center">
                          {game.image_url && (
                            <img
                              src={game.image_url}
                              alt={game.name}
                              className="w-10 h-10 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-800">{game.name}</div>
                            {game.description && (
                              <div className="text-sm text-gray-600 truncate">
                                {game.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Nenhum jogo encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={closeMenu}>
          <div
            className="absolute top-0 right-0 h-full w-80 max-w-sm bg-white shadow-lg transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Menu</h2>
                <button
                  onClick={closeMenu}
                  className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label="Fechar menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Menu Items */}
              <nav className="space-y-2">
                <Link
                  to="/games"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={closeMenu}
                >
                  <span className="ml-3">Jogos</span>
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/create-ad"
                      className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={closeMenu}
                    >
                      <Plus className="w-5 h-5" />
                      <span className="ml-3">Criar Anúncio</span>
                    </Link>

                    <Link
                      to="/favorites"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={closeMenu}
                    >
                      <Heart className="w-5 h-5" />
                      <span className="ml-3">Favoritos</span>
                    </Link>

                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={closeMenu}
                    >
                      <BarChart3 className="w-5 h-5" />
                      <span className="ml-3">Dashboard</span>
                    </Link>

                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={closeMenu}
                    >
                      <Settings className="w-5 h-5" />
                      <span className="ml-3">Meu Perfil</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="ml-3">Sair</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={closeMenu}
                    >
                      <span className="ml-3">Entrar</span>
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={closeMenu}
                    >
                      <span className="ml-3">Cadastrar</span>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;