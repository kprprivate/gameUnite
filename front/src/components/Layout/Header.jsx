import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext'; // ADICIONAR IMPORT
import { useGames } from '../../contexts/GameContext';
import { useDebounce } from '../../hooks';
import {
  User,
  LogOut,
  Plus,
  Search,
  Menu,
  X,
  ShoppingCart,
  Settings,
  BarChart3,
  ShoppingBag,
  Heart,
  Bell,
  ChevronDown
} from 'lucide-react';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cart } = useCart(); // USAR CONTEXTO DO CARRINHO
  const { fetchGames } = useGames();
  const navigate = useNavigate();

  // Estados
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Refs
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Effects
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      handleSearch(debouncedSearch);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearch]);

  // Carregar notificações quando autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
      // Simular atualização periódica das notificações
      const interval = setInterval(loadNotifications, 30000); // 30 segundos
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Funções
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
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleSearchSelect = (gameId) => {
    setSearchTerm('');
    setShowSearchResults(false);
    setIsMenuOpen(false);
    navigate(`/games/${gameId}`);
  };

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsNotificationOpen(false);
  };

  // Função para carregar notificações (simulada)
  const loadNotifications = async () => {
    try {
      // Simular dados de notificação - você pode implementar a API depois
      const mockNotifications = [
        {
          id: 1,
          type: 'order',
          title: 'Novo pedido recebido',
          message: 'Você recebeu um novo pedido para "Counter-Strike 2"',
          timestamp: new Date(Date.now() - 5 * 60000), // 5 minutos atrás
          read: false,
          link: '/orders'
        },
        {
          id: 2,
          type: 'message',
          title: 'Nova mensagem',
          message: 'João enviou uma pergunta sobre seu anúncio',
          timestamp: new Date(Date.now() - 15 * 60000), // 15 minutos atrás
          read: false,
          link: '/dashboard'
        },
        {
          id: 3,
          type: 'favorite',
          title: 'Anúncio favoritado',
          message: 'Seu anúncio "Valorant" foi favoritado',
          timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 horas atrás
          read: true,
          link: '/dashboard'
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'agora';
  };

  // CORRIGIDO: Usar dados do contexto do carrinho
  const cartItemCount = cart?.total_items || 0;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
            onClick={closeAllMenus}
          >
            GameUnite
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8" ref={searchRef}>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar jogos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-6">
            {/* Public Links */}
            <Link
              to="/games"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Jogos
            </Link>

            {isAuthenticated ? (
              <>
                {/* Create Ad Button */}
                <Link
                  to="/create-ad"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Anunciar
                </Link>

                {/* Cart - CORRIGIDO */}
                <Link
                  to="/cart"
                  className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[24rem] overflow-hidden">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">Notificações</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Marcar todas como lidas
                          </button>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                                !notification.read ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => {
                                if (!notification.read) {
                                  markAsRead(notification.id);
                                }
                                navigate(notification.link);
                                setIsNotificationOpen(false);
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-full ${
                                  notification.type === 'order' ? 'bg-green-100 text-green-600' :
                                  notification.type === 'message' ? 'bg-blue-100 text-blue-600' :
                                  'bg-red-100 text-red-600'
                                }`}>
                                  {notification.type === 'order' ? '🛒' :
                                   notification.type === 'message' ? '💬' : '❤️'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-800 truncate">
                                      {notification.title}
                                    </p>
                                    <span className="text-xs text-gray-500">
                                      {formatNotificationTime(notification.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Nenhuma notificação</p>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 text-center">
                          <Link
                            to="/notifications"
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            onClick={() => setIsNotificationOpen(false)}
                          >
                            Ver todas as notificações
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      {user?.profile_pic ? (
                        <img
                          src={user.profile_pic}
                          alt="Profile"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* User Dropdown */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="font-medium text-gray-900">
                          {user?.first_name} {user?.last_name}
                        </div>
                        <div className="text-sm text-gray-600">@{user?.username}</div>
                      </div>

                      {/* Menu Items */}
                      <Link
                        to="/dashboard"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={closeAllMenus}
                      >
                        <BarChart3 className="w-5 h-5 mr-3" />
                        Dashboard
                      </Link>

                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={closeAllMenus}
                      >
                        <User className="w-5 h-5 mr-3" />
                        Meu Perfil
                      </Link>

                      <Link
                        to="/orders"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={closeAllMenus}
                      >
                        <ShoppingBag className="w-5 h-5 mr-3" />
                        Meus Pedidos
                      </Link>

                      <Link
                        to="/favorites"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={closeAllMenus}
                      >
                        <Heart className="w-5 h-5 mr-3" />
                        Favoritos
                      </Link>

                      <Link
                        to="/support"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={closeAllMenus}
                      >
                        <Bell className="w-5 h-5 mr-3" />
                        Suporte
                      </Link>

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={closeAllMenus}
                        >
                          <Settings className="w-5 h-5 mr-3" />
                          Administração
                        </Link>
                      )}

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-5 h-5 mr-3" />
                          Sair
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Auth Links */
              <div className="flex items-center space-x-4">
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
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            {/* Mobile Search */}
            <div className="mb-4" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar jogos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mobile Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {searchResults.map((game) => (
                    <button
                      key={game._id}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSearchSelect(game._id)}
                    >
                      <div className="font-medium text-gray-800">{game.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              <Link
                to="/games"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={closeAllMenus}
              >
                Jogos
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/create-ad"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeAllMenus}
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Criar Anúncio
                  </Link>

                  {/* Cart Mobile - CORRIGIDO */}
                  <Link
                    to="/cart"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeAllMenus}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Carrinho
                    {cartItemCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/dashboard"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeAllMenus}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    Dashboard
                  </Link>

                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeAllMenus}
                  >
                    <ShoppingBag className="w-4 h-4 inline mr-2" />
                    Meus Pedidos
                  </Link>

                  <Link
                    to="/favorites"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeAllMenus}
                  >
                    <Heart className="w-4 h-4 inline mr-2" />
                    Favoritos
                  </Link>

                  <Link
                    to="/support"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeAllMenus}
                  >
                    <Bell className="w-4 h-4 inline mr-2" />
                    Suporte
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={closeAllMenus}
                    >
                      <Settings className="w-4 h-4 inline mr-2" />
                      Administração
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeAllMenus}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Perfil
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 inline mr-2" />
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={closeAllMenus}
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                    onClick={closeAllMenus}
                  >
                    Cadastrar
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;