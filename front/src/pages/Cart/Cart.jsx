// front/src/pages/Ads/AdDetails.jsx - VERSÃO COM FAVORITOS CORRIGIDOS
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { adService } from '../../services';
import { favoritesService } from '../../services/favoritesService';
import { cartUtils } from '../../utils/cartUtils';
import { Calendar, MapPin, User, MessageCircle, Heart, Share2, Eye, ShoppingCart, Check } from 'lucide-react';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const AdDetails = () => {
  const { adId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para favoritos
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Estados para carrinho
  const [isInCart, setIsInCart] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    const fetchAdDetails = async () => {
      setLoading(true);

      try {
        const result = await adService.getAd(adId);
        if (result.success) {
          setAd(result.data.ad);

          // Definir contagem de favoritos (do backend ou da resposta)
          setFavoritesCount(result.data.ad.favorites_count || 0);

          // Verificar se está no carrinho
          setIsInCart(cartUtils.isInCart(adId));

          // Se o usuário está logado, verificar se favoritou este anúncio
          if (isAuthenticated) {
            await checkIfFavorited();
          } else {
            setIsFavorited(false);
          }
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error('Erro ao carregar anúncio:', error);
        toast.error('Erro ao carregar anúncio');
      }

      setLoading(false);
    };

    const checkIfFavorited = async () => {
      try {
        const favoriteResult = await favoritesService.checkIsFavorite(adId);
        if (favoriteResult.success) {
          setIsFavorited(favoriteResult.data.is_favorited);
        }
      } catch (error) {
        console.error('Erro ao verificar favorito:', error);
        // Não mostrar erro para o usuário, apenas logar
      }
    };

    fetchAdDetails();
  }, [adId, isAuthenticated]);

  // Listener para mudanças no carrinho
  useEffect(() => {
    const handleCartUpdate = () => {
      setIsInCart(cartUtils.isInCart(adId));
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, [adId]);

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info('Faça login para favoritar anúncios');
      return;
    }

    if (favoriteLoading) return;

    setFavoriteLoading(true);

    try {
      const result = await favoritesService.toggleFavorite(adId);
      if (result.success) {
        const newIsFavorited = result.data.is_favorited;
        setIsFavorited(newIsFavorited);

        // Atualizar contador baseado na ação
        if (result.data.action === 'added') {
          setFavoritesCount(prev => prev + 1);
        } else if (result.data.action === 'removed') {
          setFavoritesCount(prev => Math.max(0, prev - 1));
        }

        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      toast.error('Erro ao favoritar anúncio');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info('Faça login para adicionar ao carrinho');
      return;
    }

    if (cartLoading) return;

    // Verificar se é anúncio de venda
    if (ad.ad_type !== 'venda') {
      toast.error('Apenas anúncios de venda podem ser adicionados ao carrinho');
      return;
    }

    // Verificar se não é o próprio anúncio
    if (ad.user_id === user?._id) {
      toast.error('Você não pode adicionar seu próprio anúncio ao carrinho');
      return;
    }

    // Verificar se tem preço
    if (!ad.price || ad.price <= 0) {
      toast.error('Este anúncio não possui preço válido');
      return;
    }

    setCartLoading(true);

    try {
      const result = cartUtils.addToCart(ad, 1);
      if (result.success) {
        setIsInCart(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setCartLoading(false);
    }
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
      toast.success('Link copiado para a área de transferência!');
    }
  };

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

  // Verificar se pode mostrar o botão de carrinho
  const canAddToCart = (
    ad.ad_type === 'venda' &&
    ad.price &&
    ad.price > 0 &&
    isAuthenticated &&
    ad.user_id !== user?._id
  );

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
                  src={ad.image_url || ad.game?.image_url || 'https://via.placeholder.com/600x400/9CA3AF/FFFFFF?text=Sem+Imagem'}
                  alt={ad.title}
                  className="w-full h-96 object-cover"
                />
              </div>
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
                      {ad.view_count} visualizações
                    </div>
                    {ad.user?.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {ad.user.location}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Botão de Favoritar - CORRIGIDO */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleFavorite}
                      disabled={favoriteLoading}
                      className={`p-2 rounded-full transition-colors duration-200 ${
                        isFavorited 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                      } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <Heart className={`w-5 h-5 transition-all duration-200 ${
                        isFavorited ? 'fill-current text-red-600' : 'text-gray-600'
                      }`} />
                    </button>
                    <span className="text-sm text-gray-600 font-medium">{favoritesCount}</span>
                  </div>

                  {/* Botão de Compartilhar */}
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                    title="Compartilhar anúncio"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Preço e Tipo */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {ad.ad_type === 'venda' && ad.price && (
                    <div className="text-3xl font-bold text-green-600">
                      R$ {ad.price.toFixed(2)}
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
                  {ad.is_boosted && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      ⭐ Destaque
                    </span>
                  )}
                </div>

                {/* Botões de Ação */}
                {canAddToCart && (
                  <div className="flex space-x-3">
                    {isInCart ? (
                      <Link to="/cart">
                        <Button variant="outline" className="inline-flex items-center">
                          <Check className="w-4 h-4 mr-2" />
                          Ver no Carrinho
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        onClick={handleAddToCart}
                        loading={cartLoading}
                        className="inline-flex items-center"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Adicionar ao Carrinho
                      </Button>
                    )}
                  </div>
                )}
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
                {ad.game && (
                  <div className="col-span-2">
                    <span className="text-sm font-medium text-gray-600">Jogo:</span>
                    <p className="text-gray-800">{ad.game.name}</p>
                  </div>
                )}
              </div>

              {/* Jogos Desejados (para trocas) */}
              {ad.ad_type === 'troca' && ad.desired_games && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Jogos Desejados para Troca</h3>
                  <p className="text-blue-700">{ad.desired_games}</p>
                </div>
              )}

              {/* Descrição */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Descrição</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{ad.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Call to Action Principal */}
            {canAddToCart && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    R$ {ad.price.toFixed(2)}
                  </div>
                  <p className="text-gray-600 mb-4">Preço do jogo</p>

                  {isInCart ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center text-green-600 mb-2">
                        <Check className="w-5 h-5 mr-2" />
                        <span className="font-medium">No seu carrinho</span>
                      </div>
                      <Link to="/cart" className="block">
                        <Button className="w-full" size="lg">
                          Finalizar Compra
                        </Button>
                      </Link>
                      <Link to="/cart" className="block">
                        <Button variant="outline" className="w-full">
                          Ver Carrinho
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Button
                      onClick={handleAddToCart}
                      loading={cartLoading}
                      className="w-full inline-flex items-center justify-center"
                      size="lg"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Adicionar ao Carrinho
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Informações do Vendedor */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {ad.ad_type === 'venda' ? 'Vendedor' : ad.ad_type === 'troca' ? 'Anunciante' : 'Comprador'}
              </h3>

              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  {ad.user?.profile_pic ? (
                    <img
                      src={ad.user.profile_pic}
                      alt={ad.user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {ad.user?.first_name && ad.user?.last_name
                      ? `${ad.user.first_name} ${ad.user.last_name}`
                      : ad.user?.username || 'Usuário'}
                  </p>
                  <p className="text-sm text-gray-600">@{ad.user?.username || 'usuario'}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avaliação como vendedor:</span>
                  <span className="font-medium">
                    ⭐ {ad.user?.seller_rating?.toFixed(1) || '0.0'}/5
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avaliações:</span>
                  <span className="font-medium">{ad.user?.seller_ratings_count || 0}</span>
                </div>
              </div>

              {isAuthenticated ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleContact}
                    className="w-full inline-flex items-center justify-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Entrar em Contato
                  </Button>
                  <Link to={`/users/${ad.user?._id}`}>
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      Ver Perfil do {ad.ad_type === 'venda' ? 'Vendedor' : 'Anunciante'}
                    </Button>
                  </Link>
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
            {ad.game && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Sobre o Jogo</h3>

                <div className="flex items-center mb-4">
                  <img
                    src={ad.game.image_url || 'https://via.placeholder.com/64x64/9CA3AF/FFFFFF?text=Game'}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdDetails;