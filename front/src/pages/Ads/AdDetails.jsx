// front/src/pages/Ads/AdDetails.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useChat } from '../../contexts/ChatContext';
import { adService } from '../../services/adService';
import { favoritesService } from '../../services/favoritesService';
import { reportsService } from '../../services/reportsService';
import { cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';
import {
  ArrowLeft,
  Eye,
  Calendar,
  MapPin,
  Star,
  Flag,
  Share2,
  Edit,
  Trash2,
  User,
  Package,
  GamepadIcon,
  Tag,
  Clock,
  DollarSign,
  MessageCircle,
  ShoppingCart,
  Heart
} from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import FavoriteButton from '../../components/Common/FavoriteButton';
import AddToCartButton from '../../components/Common/AddToCartButton';
import SafeImage from '../../components/Common/SafeImage';
import AdQuestions from '../../components/Ad/AdQuestions';
import { formatSellerStatus } from '../../utils/helpers';

const AdDetails = () => {
  const { adId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isInCart } = useCart();
  const { chatEnabled, startConversation } = useChat();

  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [similarAds, setSimilarAds] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Estados para interações - CORRIGIDOS
  const [viewCount, setViewCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (adId) {
      loadAdDetails();
    }
  }, [adId]);

  // Verificar se o anúncio está favoritado quando o usuário estiver autenticado
  useEffect(() => {
    if (adId && isAuthenticated && ad) {
      checkIfFavorited();
    }
  }, [adId, isAuthenticated, ad]);

  useEffect(() => {
    if (ad && ad.game_id) {
      loadSimilarAds();
    }
  }, [ad]);

  const loadAdDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Carregando detalhes do anúncio:', adId);

      const result = await adService.getAd(adId);

      console.log('📦 Resultado completo:', result);

      if (result.success) {
        const adData = result.data.ad;

        console.log('📋 Dados do anúncio:', adData);

        setAd(adData);
        setViewCount(adData.view_count || 0);

        // CORREÇÃO: Usar os dados corretos dos favoritos
        setFavoritesCount(adData.favorites_count || 0);
        setIsFavorited(adData.is_favorited || adData.user_favorited || false);

        console.log('❤️ Estado dos favoritos:', {
          count: adData.favorites_count,
          isFavorited: adData.is_favorited || adData.user_favorited
        });
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      console.error('💥 Erro ao carregar anúncio:', error);
      setError('Erro ao carregar anúncio');
      toast.error('Erro ao carregar anúncio');
    }

    setLoading(false);
  };

  const loadSimilarAds = async () => {
    if (!ad || !ad.game_id) return;
    
    setLoadingSimilar(true);
    
    try {
      const result = await adService.getAds({ 
        game_id: ad.game_id, 
        limit: 4,
        skip: 0 
      });
      
      if (result.success) {
        // Filtrar o anúncio atual e pegar apenas 3 similares
        const filtered = result.data.ads
          .filter(similarAd => similarAd._id !== ad._id)
          .slice(0, 3);
        setSimilarAds(filtered);
      }
    } catch (error) {
      console.error('Erro ao carregar anúncios similares:', error);
    }
    
    setLoadingSimilar(false);
  };

  const checkIfFavorited = async () => {
    if (!isAuthenticated || !adId) return;

    try {
      const result = await favoritesService.checkIsFavorite(adId);
      if (result.success) {
        setIsFavorited(result.data.is_favorited || false);
      }
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
      setIsFavorited(false);
    }
  };

  const handleDeleteAd = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este anúncio?')) {
      return;
    }

    setDeleting(true);

    try {
      const result = await adService.deleteAd(adId);

      if (result.success) {
        toast.success('Anúncio excluído com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao excluir anúncio');
    }

    setDeleting(false);
  };

  // CORREÇÃO: Função para lidar com favoritos
  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Faça login para favoritar anúncios');
      return;
    }

    try {
      const result = await favoritesService.toggleFavorite(adId);

      if (result.success) {
        const newIsFavorited = result.data.is_favorited;
        setIsFavorited(newIsFavorited);

        // Atualizar contador baseado na ação
        if (newIsFavorited) {
          setFavoritesCount(prev => prev + 1);
        } else {
          setFavoritesCount(prev => Math.max(0, prev - 1));
        }

        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      toast.error('Erro ao favoritar anúncio');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad.title,
          text: `Confira este anúncio: ${ad.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // Usuário cancelou o compartilhamento
      }
    } else {
      // Fallback: copiar URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const handleReport = async () => {
    if (!isAuthenticated) {
      toast.info('Faça login para reportar anúncios');
      return;
    }

    if (!reportReason.trim()) {
      toast.error('Selecione um motivo para o report');
      return;
    }

    setSubmittingReport(true);

    try {
      const reportData = {
        reported_item_id: adId,
        reported_item_type: 'ad',
        reason: reportReason,
        details: reportDetails
      };

      const result = await reportsService.createReport(reportData);
      
      if (result.success) {
        toast.success('Report enviado com sucesso! Nossa equipe irá analisar.');
        setShowReportModal(false);
        setReportReason('');
        setReportDetails('');
      } else {
        toast.error(result.message || 'Erro ao enviar report');
      }
    } catch (error) {
      console.error('Erro ao enviar report:', error);
      toast.error('Erro ao enviar report. Tente novamente.');
    }

    setSubmittingReport(false);
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.info('Faça login para comprar');
      return;
    }

    try {
      // Adicionar ao carrinho primeiro
      const cartResult = await cartService.addToCart(adId, 1);
      
      if (cartResult.success) {
        // Ir direto para o checkout
        navigate('/checkout');
      } else {
        toast.error(cartResult.message);
      }
    } catch (error) {
      console.error('Erro ao comprar agora:', error);
      toast.error('Erro ao processar compra');
    }
  };

  const handleSendMessage = async () => {
    if (!isAuthenticated) {
      toast.info('Faça login para enviar mensagens');
      return;
    }

    if (!chatEnabled) {
      toast.info('Chat está desabilitado pelos administradores');
      return;
    }

    try {
      // Iniciar conversa e navegar para o chat
      const result = await startConversation(ad.user_id, '', adId);
      if (result?.success) {
        navigate(`/chat/${ad.user_id}?ad=${adId}`);
      } else {
        toast.error('Erro ao iniciar conversa');
      }
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      toast.error('Erro ao iniciar conversa');
    }
  };

  const reportReasons = [
    { value: 'spam', label: 'Spam ou conteúdo repetitivo' },
    { value: 'fake', label: 'Anúncio falso ou enganoso' },
    { value: 'inappropriate', label: 'Conteúdo inapropriado' },
    { value: 'scam', label: 'Tentativa de golpe' },
    { value: 'wrong_category', label: 'Categoria incorreta' },
    { value: 'other', label: 'Outro motivo' }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAdTypeColor = (type) => {
    switch (type) {
      case 'venda':
        return 'success';
      case 'troca':
        return 'primary';
      case 'procura':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getConditionText = (condition) => {
    const conditions = {
      novo: 'Novo (lacrado)',
      seminovo: 'Seminovo',
      usado: 'Usado',
      regular: 'Regular'
    };
    return conditions[condition] || condition;
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
    );
  }

  if (error || !ad) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {error || 'Anúncio não encontrado'}
            </h2>
            <Button onClick={() => navigate('/games')}>
              Voltar aos Jogos
            </Button>
          </div>
        </div>
    );
  }

  const isOwner = isAuthenticated && user && (user._id === ad.user_id || user._id === ad.user?._id);

  return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumb/Back Button */}
          <div className="mb-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Imagem Principal - CORRIGIDA */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  {imageLoading && (
                      <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
                        <Package className="w-16 h-16 text-gray-400" />
                      </div>
                  )}

                  <div className="w-full h-96 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {ad.image_url ? (
                        <img
                            src={ad.image_url}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                            onLoad={() => setImageLoading(false)}
                            onError={(e) => {
                              console.log('❌ Erro ao carregar imagem:', ad.image_url);
                              setImageLoading(false);
                              e.target.style.display = 'none';
                            }}
                            style={{ display: imageLoading ? 'none' : 'block' }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Package className="w-16 h-16 text-gray-400" />
                          <span className="ml-2 text-gray-500">Sem imagem</span>
                        </div>
                    )}
                  </div>

                  {/* Badges sobrepostos */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <Badge variant={getAdTypeColor(ad.ad_type)} size="lg">
                      {ad.ad_type === 'venda' ? 'Venda' : ad.ad_type === 'troca' ? 'Troca' : 'Procura'}
                    </Badge>

                    {ad.condition && (
                        <Badge variant="secondary" size="lg">
                          {getConditionText(ad.condition)}
                        </Badge>
                    )}
                  </div>

                  {/* Ações do proprietário */}
                  {isOwner && (
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <Link
                            to={`/ads/${ad._id}/edit`}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full transition-colors"
                            title="Editar anúncio"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={handleDeleteAd}
                            disabled={deleting}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors disabled:opacity-50"
                            title="Excluir anúncio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                  )}
                </div>
              </div>

              {/* Informações Principais */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                      {ad.title}
                    </h1>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {viewCount} visualizações
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(ad.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* CORREÇÃO: Botão de favorito simplificado */}
                    <button
                        onClick={handleFavoriteToggle}
                        disabled={!isAuthenticated}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                            isFavorited
                                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={isAuthenticated ? (isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos') : 'Faça login para favoritar'}
                    >
                      <Heart
                          className={`w-5 h-5 ${isFavorited ? 'fill-current text-red-600' : 'text-gray-600'}`}
                      />
                      <span className="text-sm font-medium">{favoritesCount}</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors"
                        title="Compartilhar"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Resto do conteúdo permanece igual... */}
                {/* Preço */}
                {ad.price && ad.ad_type === 'venda' && (
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-green-600">
                        R$ {parseFloat(ad.price).toFixed(2)}
                      </div>
                    </div>
                )}

                {/* Jogos Desejados para Troca */}
                {ad.ad_type === 'troca' && ad.desired_games && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                        <GamepadIcon className="w-5 h-5 mr-2" />
                        Jogos Desejados para Troca:
                      </h3>
                      <p className="text-blue-800">{ad.desired_games}</p>
                    </div>
                )}

                {/* Descrição */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Descrição</h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {ad.description}
                  </p>
                </div>

                {/* Especificações */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600">Jogo</div>
                    <div className="font-semibold text-gray-800">
                      {ad.game?.name || 'Não informado'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Plataforma</div>
                    <div className="font-semibold text-gray-800">
                      {ad.platform || 'Não informado'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Estado</div>
                    <div className="font-semibold text-gray-800">
                      {getConditionText(ad.condition)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <Badge variant={ad.status === 'active' ? 'success' : 'secondary'}>
                      {ad.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Seção de Perguntas */}
              <AdQuestions ad={ad} isOwner={isOwner} />

              {/* Anúncios Similares */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Anúncios Similares
                </h3>
                
                {loadingSimilar ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : similarAds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {similarAds.map((similarAd) => (
                      <div 
                        key={similarAd._id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => navigate(`/ads/${similarAd._id}`)}
                      >
                        <div className="aspect-video bg-gray-200 overflow-hidden">
                          {similarAd.image_url ? (
                            <img
                              src={similarAd.image_url}
                              alt={similarAd.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h4 className="font-medium text-gray-800 truncate mb-1">
                            {similarAd.title}
                          </h4>
                          
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              similarAd.ad_type === 'venda' ? 'bg-green-100 text-green-700' :
                              similarAd.ad_type === 'troca' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {similarAd.ad_type === 'venda' ? 'Venda' : 
                               similarAd.ad_type === 'troca' ? 'Troca' : 'Procura'}
                            </span>
                          </div>
                          
                          {similarAd.price && similarAd.ad_type === 'venda' && (
                            <p className="text-lg font-bold text-green-600 mb-2">
                              R$ {parseFloat(similarAd.price).toFixed(2)}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {similarAd.view_count || 0}
                            </div>
                            <div className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              {similarAd.favorites_count || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-600">
                      Nenhum anúncio similar encontrado
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Vendedor - CORRIGIDO */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  {ad.ad_type === 'venda' ? 'Vendedor' : ad.ad_type === 'troca' ? 'Anunciante' : 'Comprador'}
                </h3>

                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
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
                    <div className="font-semibold text-gray-800">
                      {ad.user?.first_name} {ad.user?.last_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      @{ad.user?.username}
                    </div>
                  </div>
                </div>

                {/* CORREÇÃO: Informações dinâmicas do vendedor */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    {(() => {
                      const sellerStatus = formatSellerStatus(ad.user?.seller_rating, ad.user?.sales_count);
                      if (sellerStatus.isStarting) {
                        return (
                          <span>
                            Vendedor: <span className="text-blue-600 font-medium">{sellerStatus.display}</span>
                            {sellerStatus.salesCount > 0 && ` (${sellerStatus.salesCount} ${sellerStatus.salesCount === 1 ? 'venda' : 'vendas'})`}
                          </span>
                        );
                      } else {
                        return (
                          <span>
                            Avaliação: {sellerStatus.display}
                            ({sellerStatus.salesCount} {sellerStatus.salesCount === 1 ? 'venda' : 'vendas'})
                          </span>
                        );
                      }
                    })()}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {ad.user?.city && ad.user?.state
                        ? `${ad.user.city}, ${ad.user.state}`
                        : ad.user?.location || 'Localização não informada'
                    }
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Membro desde {ad.user?.member_since || new Date().getFullYear()}
                  </div>
                </div>

                {!isOwner && (
                    <div className="space-y-3">
                      <Link
                          to={`/users/${ad.user_id}`}
                          className="block w-full text-center"
                      >
                        <Button variant="outline" className="w-full">
                          Ver Perfil
                        </Button>
                      </Link>

                      {chatEnabled ? (
                        <Button 
                          className="w-full"
                          onClick={handleSendMessage}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Enviar Mensagem
                        </Button>
                      ) : (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500">
                            Mensagens estão temporariamente desabilitadas
                          </p>
                        </div>
                      )}
                    </div>
                )}
              </div>

              {/* Resto da sidebar permanece igual... */}
              {/* Ações de Compra */}
              {!isOwner && ad.ad_type === 'venda' && ad.status === 'active' && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Interessado?
                    </h3>

                    <div className="space-y-3">
                      <AddToCartButton
                          ad={ad}
                          className="w-full"
                          size="lg"
                      />

                      {isInCart(adId) ? (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => navigate('/cart')}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Ver Carrinho
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={handleBuyNow}
                        >
                          Comprar Agora
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm text-green-800">
                        <div className="font-semibold mb-1">🛡️ Compra Protegida</div>
                        <ul className="text-xs space-y-1">
                          <li>• Pagamento seguro</li>
                          <li>• Chat com vendedor</li>
                          <li>• Suporte dedicado</li>
                        </ul>
                      </div>
                    </div>
                  </div>
              )}

              {/* Relatório */}
              {!isOwner && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Reportar Problema
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Encontrou algo suspeito neste anúncio?
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowReportModal(true)}
                      disabled={!isAuthenticated}
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Reportar
                    </Button>
                  </div>
              )}

            </div>
          </div>
        </div>

        {/* Modal de Report */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Reportar Anúncio
                  </h3>
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo do report *
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione um motivo</option>
                      {reportReasons.map((reason) => (
                        <option key={reason.value} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detalhes (opcional)
                    </label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Descreva o problema com mais detalhes..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="4"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowReportModal(false)}
                      className="flex-1"
                      disabled={submittingReport}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleReport}
                      className="flex-1"
                      disabled={submittingReport || !reportReason.trim()}
                    >
                      {submittingReport ? 'Enviando...' : 'Enviar Report'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default AdDetails;