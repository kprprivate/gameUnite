import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, MapPin, User, MessageCircle, Heart, Share2, Eye } from 'lucide-react';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const AdDetails = () => {
  const { adId } = useParams();
  const { isAuthenticated } = useAuth();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchAdDetails = async () => {
      setLoading(true);
      
      // Mock data - substituir pela chamada real da API
      const mockAd = {
        _id: adId,
        title: 'FIFA 24 - PlayStation 5',
        description: 'Jogo em perfeito estado, pouco usado. Comprei no lançamento mas acabei não jogando muito. Inclui todos os updates e está funcionando perfeitamente. Sem riscos no disco.',
        price: 200,
        ad_type: 'venda',
        platform: 'PlayStation 5',
        condition: 'seminovo',
        images: [
          'https://via.placeholder.com/600x400/3B82F6/FFFFFF?text=FIFA+24',
          'https://via.placeholder.com/600x400/1D4ED8/FFFFFF?text=Game+Box'
        ],
        user: {
          _id: 'user1',
          username: 'gamer123',
          first_name: 'João',
          last_name: 'Silva',
          avatar: null,
          rating: 4.8,
          total_ads: 15
        },
        game: {
          _id: 'game1',
          name: 'FIFA 24',
          image_url: 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=FIFA+24'
        },
        location: 'São Paulo, SP',
        views: 47,
        likes: 12,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z'
      };

      setAd(mockAd);
      setLoading(false);
    };

    fetchAdDetails();
  }, [adId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ad.title,
        text: ad.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleContact = () => {
    // Implementar lógica de contato
    console.log('Contatar vendedor');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Anúncio não encontrado</h2>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2">
            {/* Imagens */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={ad.images[0]}
                  alt={ad.title}
                  className="w-full h-96 object-cover"
                />
              </div>
              {ad.images.length > 1 && (
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-2">
                    {ad.images.slice(1).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${ad.title} ${index + 2}`}
                        className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-75"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Detalhes do Anúncio */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">{ad.title}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(ad.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {ad.views} visualizações
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {ad.location}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleLike}
                    className={`p-2 rounded-full ${
                      isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    } hover:bg-red-100 hover:text-red-600`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Preço e Tipo */}
              <div className="flex items-center space-x-4 mb-6">
                {ad.ad_type === 'venda' && (
                  <div className="text-3xl font-bold text-green-600">
                    R$ {ad.price}
                  </div>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  ad.ad_type === 'venda' 
                    ? 'bg-green-100 text-green-800'
                    : ad.ad_type === 'troca'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {ad.ad_type.charAt(0).toUpperCase() + ad.ad_type.slice(1)}
                </span>
              </div>

              {/* Especificações */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-600">Plataforma:</span>
                  <p className="text-gray-800">{ad.platform}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Estado:</span>
                  <p className="text-gray-800 capitalize">{ad.condition}</p>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Descrição</h3>
                <p className="text-gray-700 leading-relaxed">{ad.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Informações do Vendedor */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendedor</h3>
              
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  {ad.user.avatar ? (
                    <img
                      src={ad.user.avatar}
                      alt={ad.user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {ad.user.first_name} {ad.user.last_name}
                  </p>
                  <p className="text-sm text-gray-600">@{ad.user.username}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avaliação:</span>
                  <span className="font-medium">⭐ {ad.user.rating}/5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total de anúncios:</span>
                  <span className="font-medium">{ad.user.total_ads}</span>
                </div>
              </div>

              {isAuthenticated ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleContact}
                    className="w-full"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Entrar em Contato
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    Ver Perfil do Vendedor
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Faça login para entrar em contato
                  </p>
                  <Link to="/login">
                    <Button className="w-full">
                      Fazer Login
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Informações do Jogo */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Sobre o Jogo</h3>
              
              <div className="flex items-center mb-4">
                <img
                  src={ad.game.image_url}
                  alt={ad.game.name}
                  className="w-16 h-16 object-cover rounded-lg mr-4"
                />
                <div>
                  <h4 className="font-medium text-gray-800">{ad.game.name}</h4>
                  <Link
                    to={`/games/${ad.game._id}`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Ver mais sobre este jogo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetails;
