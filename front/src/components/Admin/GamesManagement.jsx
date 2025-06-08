import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Modal, 
  Badge, 
  LoadingSpinner, 
  Alert, 
  Pagination,
  ImageUpload 
} from '../Common';
import { useApi } from '../../hooks';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  Star,
  Upload,
  Image as ImageIcon,
  Tag,
  Globe,
  Search,
  Filter,
  MoreVertical,
  Zap,
  Users,
  TrendingUp
} from 'lucide-react';

const GamesManagement = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  const api = useApi();

  useEffect(() => {
    loadGames();
  }, [currentPage, searchTerm, statusFilter]);

  const loadGames = async () => {
    setLoading(true);
    try {
      const response = await api.get('/games');
      // A API retorna {success: true, data: {games: []}}
      if (response.success && response.data?.games) {
        setGames(response.data.games);
      } else {
        setGames([]);
      }
    } catch (error) {
      console.error('Erro ao carregar jogos:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = () => {
    setModalType('create');
    setSelectedGame(null);
    setShowModal(true);
  };

  const handleEditGame = (game) => {
    setModalType('edit');
    setSelectedGame(game);
    setShowModal(true);
  };

  const handleDeleteGame = async (gameId) => {
    if (window.confirm('Tem certeza que deseja deletar este jogo?')) {
      try {
        await api.delete(`/games/${gameId}`);
        await loadGames();
      } catch (error) {
        console.error('Erro ao deletar jogo:', error);
      }
    }
  };

  const handleToggleFeatured = async (gameId, currentStatus) => {
    try {
      await api.put(`/games/${gameId}`, {
        is_featured: !currentStatus
      });
      await loadGames();
    } catch (error) {
      console.error('Erro ao alterar destaque:', error);
    }
  };

  const handleToggleActive = async (gameId, currentStatus) => {
    try {
      await api.put(`/games/${gameId}`, {
        is_active: !currentStatus
      });
      await loadGames();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && game.is_active) ||
      (statusFilter === 'inactive' && !game.is_active) ||
      (statusFilter === 'featured' && game.is_featured);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestão de Jogos</h2>
          <p className="text-gray-600">Gerencie jogos, categorias e destaques</p>
        </div>
        <Button
          onClick={handleCreateGame}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Jogo
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar jogos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="featured">Em Destaque</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Jogos"
          value={games.length}
          icon={Globe}
          color="blue"
        />
        <StatCard
          title="Jogos Ativos"
          value={games.filter(g => g.is_active).length}
          icon={Zap}
          color="green"
        />
        <StatCard
          title="Em Destaque"
          value={games.filter(g => g.is_featured).length}
          icon={Star}
          color="yellow"
        />
        <StatCard
          title="Com Anúncios"
          value={games.reduce((total, game) => total + (game.ads_count || 0), 0)}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Games Grid */}
      {filteredGames.length === 0 ? (
        <Card className="p-8 text-center">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum jogo encontrado</h3>
          <p className="text-gray-600 mb-4">Comece adicionando o primeiro jogo à plataforma</p>
          <Button onClick={handleCreateGame}>
            Adicionar Primeiro Jogo
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <GameCard
              key={game._id}
              game={game}
              onEdit={handleEditGame}
              onDelete={handleDeleteGame}
              onToggleFeatured={handleToggleFeatured}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal */}
      {showModal && (
        <GameModal
          type={modalType}
          game={selectedGame}
          onClose={() => setShowModal(false)}
          onSave={loadGames}
        />
      )}
    </div>
  );
};

// Game Card Component
const GameCard = ({ game, onEdit, onDelete, onToggleFeatured, onToggleActive }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={game.image_url || '/placeholder-game.png'}
          alt={game.name}
          className="w-full h-48 object-cover"
        />
        
        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {game.is_featured && (
            <Badge variant="warning" size="sm" className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              Destaque
            </Badge>
          )}
          {!game.is_active && (
            <Badge variant="danger" size="sm">
              Inativo
            </Badge>
          )}
        </div>

        {/* Menu Button */}
        <div className="absolute top-2 right-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="bg-white/90 hover:bg-white"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                <button
                  onClick={() => onEdit(game)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => onToggleFeatured(game._id, game.is_featured)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  {game.is_featured ? 'Remover Destaque' : 'Destacar'}
                </button>
                <button
                  onClick={() => onToggleActive(game._id, game.is_active)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {game.is_active ? 'Desativar' : 'Ativar'}
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => onDelete(game._id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{game.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{game.platform}</p>
        {game.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{game.description}</p>
        )}
        
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Criado em {new Date(game.created_at).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{game.ads_count || 0} ads</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Game Modal Component
const GameModal = ({ type, game, onClose, onSave }) => {
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    platform: 'PC',
    category: '',
    is_featured: false,
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const api = useApi();

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Imagem muito grande. Máximo 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setError('');
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('type', 'games');
      
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.success) {
        return response.data.file_url;
      } else {
        throw new Error(response.message || 'Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: '' });
  };

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name || '',
        description: game.description || '',
        image_url: game.image_url || '',
        platform: game.platform || 'PC',
        category: game.category || '',
        is_featured: game.is_featured || false,
        is_active: game.is_active !== false
      });
      setImagePreview(game.image_url || null);
    }
  }, [game]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let finalFormData = { ...formData };
      
      // Se há uma nova imagem, fazer upload primeiro
      if (imageFile) {
        const imageUrl = await uploadImage();
        finalFormData.image_url = imageUrl;
      }

      if (type === 'create') {
        await api.post('/games', finalFormData);
      } else {
        await api.put(`/games/${game._id}`, finalFormData);
      }
      onSave();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Erro ao salvar jogo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {type === 'create' ? 'Adicionar Novo Jogo' : 'Editar Jogo'}
            </h2>
            <button 
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Jogo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plataforma
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PC">PC</option>
                <option value="PlayStation">PlayStation</option>
                <option value="Xbox">Xbox</option>
                <option value="Nintendo">Nintendo</option>
                <option value="Mobile">Mobile</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: FPS, RPG, Battle Royale..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagem do Jogo
              </label>
              <div className="space-y-3">
                {/* Upload Input */}
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded"
                    >
                      Remover
                    </button>
                  )}
                </div>
                
                {/* URL Input alternativo */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Ou cole uma URL de imagem:
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      if (e.target.value && !imageFile) {
                        setImagePreview(e.target.value);
                      }
                    }}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descrição do jogo..."
              />
            </div>

            {/* Preview */}
            {imagePreview && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview da Imagem
                </label>
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="text-white text-sm">Fazendo upload...</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Jogo em destaque</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Jogo ativo</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || uploading}>
            {uploading ? 'Fazendo upload...' : loading ? 'Salvando...' : type === 'create' ? 'Criar Jogo' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    purple: 'text-purple-600 bg-purple-100'
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

export default GamesManagement;