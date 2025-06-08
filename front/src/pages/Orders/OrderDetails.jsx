// front/src/pages/Orders/OrderDetails.jsx - CORREÇÃO COMPLETA
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';
import {
  ArrowLeft,
  Package,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  MessageCircle,
  Star,
  Flag,
  RefreshCw,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Tag
} from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import ChatRoom from '../../components/Chat/ChatRoom';
import RatingModal from '../../components/Common/RatingModal';
import { formatSellerStatus } from '../../utils/helpers';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);

    try {
      console.log('🔍 Carregando detalhes do pedido:', orderId);

      const result = await orderService.getOrder(orderId);

      console.log('📦 Dados do pedido (raw):', result);

      if (result.success) {
        const orderData = result.data.order || result.data;

        console.log('📋 Dados do pedido processados:', orderData);

        setOrder(orderData);
      } else {
        toast.error(result.message);
        navigate('/orders');
      }
    } catch (error) {
      console.error('💥 Erro ao carregar pedido:', error);
      toast.error('Erro ao carregar pedido');
      navigate('/orders');
    }

    setLoading(false);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Tem certeza que deseja alterar o status para "${newStatus}"?`)) {
      return;
    }

    setUpdating(true);

    try {
      // CORREÇÃO: Determinar o papel do usuário baseado na estrutura real
      const userRole = getUserRole();

      console.log('🔄 Atualizando status:', {
        orderId,
        newStatus,
        userRole,
        currentUserId: user._id,
        orderSellerId: order.seller_id,
        orderBuyerId: order.buyer_id
      });

      const result = await orderService.updateOrderStatus(orderId, newStatus, userRole);

      if (result.success) {
        toast.success(`Status atualizado para: ${newStatus}`);
        
        // Backend já envia mensagem do sistema automaticamente
        // Removido envio duplicado do frontend
        
        await loadOrderDetails(); // Recarregar dados
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('💥 Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }

    setUpdating(false);
  };

  // CORREÇÃO: Função para determinar o papel do usuário logado
  const getUserRole = () => {
    if (!user || !order) return null;

    // Verificar se é vendedor
    if (order.seller_id === user._id || order.seller?._id === user._id) {
      return 'seller';
    }

    // Verificar se é comprador
    if (order.buyer_id === user._id || order.buyer?._id === user._id) {
      return 'buyer';
    }

    // Verificar pela estrutura do anúncio
    if (order.ad_snapshot?.seller_id === user._id) {
      return 'seller';
    }

    // Fallback: se criou o pedido, provavelmente é comprador
    if (order.created_by === user._id) {
      return 'buyer';
    }

    console.warn('⚠️ Não foi possível determinar o papel do usuário');
    return null;
  };

  // CORREÇÃO: Função para obter dados do outro usuário (vendedor ou comprador)
  const getOtherUser = () => {
    if (!user || !order) return null;

    const userRole = getUserRole();

    if (userRole === 'seller') {
      // Se é vendedor, retornar dados do comprador
      return order.buyer || order.buyer_details || {
        _id: order.buyer_id,
        username: order.buyer_username || 'Comprador',
        first_name: order.buyer_name || 'Comprador',
        last_name: '',
        email: order.buyer_email || '',
        phone: order.buyer_phone || ''
      };
    } else if (userRole === 'buyer') {
      // Se é comprador, retornar dados do vendedor
      return order.seller || order.seller_details || order.ad_snapshot?.seller || {
        _id: order.seller_id || order.ad_snapshot?.seller_id,
        username: order.seller_username || order.ad_snapshot?.seller_username || 'Vendedor',
        first_name: order.seller_name || order.ad_snapshot?.seller_name || 'Vendedor',
        last_name: '',
        email: order.seller_email || '',
        phone: order.seller_phone || ''
      };
    }

    return null;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      paid: 'primary',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'danger'
    };
    return colors[status] || 'secondary';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      paid: CreditCard,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pendente',
      paid: 'Pago',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return texts[status] || status;
  };

  // CORREÇÃO: Função para determinar quais ações o usuário pode fazer
  const getAvailableActions = () => {
    if (!user || !order) return [];

    const userRole = getUserRole();
    const actions = [];

    console.log('🎯 Determinando ações disponíveis:', {
      userRole,
      currentStatus: order.status,
      userId: user._id
    });

    if (userRole === 'seller') {
      // Ações do vendedor
      switch (order.status) {
        case 'pending':
          actions.push({
            action: 'paid',
            label: 'Confirmar Pagamento',
            color: 'primary',
            description: 'Marcar como pago após receber o pagamento'
          });
          actions.push({
            action: 'cancelled',
            label: 'Cancelar Pedido',
            color: 'danger',
            description: 'Cancelar este pedido'
          });
          break;
        case 'paid':
          actions.push({
            action: 'shipped',
            label: 'Marcar como Enviado',
            color: 'info',
            description: 'Confirmar que o item foi enviado'
          });
          break;
        case 'shipped':
          actions.push({
            action: 'delivered',
            label: 'Marcar como Entregue',
            color: 'success',
            description: 'Confirmar que foi entregue'
          });
          break;
      }
    } else if (userRole === 'buyer') {
      // Ações do comprador
      switch (order.status) {
        case 'pending':
          actions.push({
            action: 'cancelled',
            label: 'Cancelar Pedido',
            color: 'danger',
            description: 'Cancelar este pedido'
          });
          break;
        case 'shipped':
          actions.push({
            action: 'delivered',
            label: 'Confirmar Recebimento',
            color: 'success',
            description: 'Confirmar que recebi o item'
          });
          break;
      }
    }

    console.log('✅ Ações disponíveis:', actions);
    return actions;
  };

  // Verificar se pode avaliar o pedido
  const canRate = () => {
    if (!order || !user) {
      return false;
    }
    
    // Verificar se o status permite avaliação
    if (order.status !== 'completed' && order.status !== 'delivered') {
      return false;
    }
    
    // Se já foi avaliado globalmente
    if (order.rating_submitted) {
      return false;
    }
    
    const userRole = getUserRole();
    
    if (userRole === 'buyer') {
      // Comprador pode avaliar se ainda não avaliou o vendedor
      return !order.seller_rating && !order.buyer_rated_seller;
    }
    
    if (userRole === 'seller') {
      // Vendedor pode avaliar se ainda não avaliou o comprador
      return !order.buyer_rating && !order.seller_rated_buyer;
    }
    
    return false;
  };

  const handleRatingSuccess = () => {
    loadOrderDetails();
    toast.success('Avaliação enviada com sucesso!');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
    );
  }

  if (!order) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Pedido não encontrado
            </h2>
            <Button onClick={() => navigate('/orders')}>
              Voltar aos Pedidos
            </Button>
          </div>
        </div>
    );
  }

  const userRole = getUserRole();
  const otherUser = getOtherUser();
  const availableActions = getAvailableActions();

  console.log('🎯 Renderização final:', {
    userRole,
    otherUser,
    availableActions,
    orderStatus: order.status
  });

  return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <button
                onClick={() => navigate('/orders')}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Pedidos
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Pedido #{order._id?.slice(-8) || 'N/A'}
                </h1>
                <div className="flex items-center space-x-4">
                  <Badge variant={getStatusColor(order.status)} className="flex items-center">
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{getStatusText(order.status)}</span>
                  </Badge>
                  <span className="text-sm text-gray-600">
                  {formatDate(order.created_at)}
                </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                    onClick={loadOrderDetails}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>

              </div>
            </div>
          </div>

          {/* Debug Info (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">🐛 Debug Info</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p><strong>Usuário atual:</strong> {user._id} ({user.username})</p>
                  <p><strong>Papel do usuário:</strong> {userRole || 'Indefinido'}</p>
                  <p><strong>Seller ID:</strong> {order.seller_id || 'N/A'}</p>
                  <p><strong>Buyer ID:</strong> {order.buyer_id || 'N/A'}</p>
                  <p><strong>Created By:</strong> {order.created_by || 'N/A'}</p>
                  <p><strong>Outro usuário:</strong> {otherUser?.username || 'N/A'}</p>
                </div>
              </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações do Produto */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Produto
                </h2>

                <div className="flex items-start space-x-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {order.ad_snapshot?.image_url ? (
                        <img
                            src={order.ad_snapshot.image_url}
                            alt={order.ad_snapshot.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {order.ad_snapshot?.title || 'Produto não informado'}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Jogo:</span>
                        <div className="font-medium">{order.ad_snapshot?.game_name || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Plataforma:</span>
                        <div className="font-medium">{order.ad_snapshot?.platform || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Estado:</span>
                        <div className="font-medium">{order.ad_snapshot?.condition || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Quantidade:</span>
                        <div className="font-medium">{order.quantity || 1}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      R$ {parseFloat(order.total_price || 0).toFixed(2)}
                    </div>
                    {order.quantity > 1 && (
                        <div className="text-sm text-gray-600">
                          R$ {parseFloat(order.unit_price || 0).toFixed(2)} cada
                        </div>
                    )}
                  </div>
                </div>

                {order.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Observações:</strong> {order.notes}
                      </p>
                    </div>
                )}
              </div>

              {/* Endereço de Entrega */}
              {order.shipping_address && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Endereço de Entrega
                    </h2>

                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>{order.contact?.first_name} {order.contact?.last_name}</strong>
                      </div>
                      <div>
                        {order.shipping_address.street}, {order.shipping_address.number}
                      </div>
                      {order.shipping_address.complement && (
                          <div>{order.shipping_address.complement}</div>
                      )}
                      <div>
                        {order.shipping_address.neighborhood} - {order.shipping_address.city}/{order.shipping_address.state}
                      </div>
                      <div>CEP: {order.shipping_address.zipcode}</div>

                      {order.contact?.phone && (
                          <div className="flex items-center mt-3">
                            <Phone className="w-4 h-4 mr-2 text-gray-600" />
                            {order.contact.phone}
                          </div>
                      )}
                      {order.contact?.email && (
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-600" />
                            {order.contact.email}
                          </div>
                      )}
                    </div>
                  </div>
              )}

              {/* Timeline do Pedido */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Histórico do Pedido
                </h2>

                <div className="space-y-4">
                  {order.status_history?.map((status, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                            status.status === order.status ? 'bg-blue-600' : 'bg-gray-300'
                        }`}></div>
                        <div>
                          <div className="font-medium">{getStatusText(status.status)}</div>
                          <div className="text-sm text-gray-600">
                            {formatDate(status.timestamp)}
                            {status.updated_by && ` - por ${status.updated_by}`}
                          </div>
                        </div>
                      </div>
                  )) || (
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          <div>
                            <div className="font-medium">Pedido Criado</div>
                            <div className="text-sm text-gray-600">
                              {formatDate(order.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                  )}
                </div>
              </div>

              {/* Chat */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat do Pedido
                </h2>
                <ChatRoom orderId={orderId} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Informações do Outro Usuário */}
              {otherUser && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      {userRole === 'seller' ? 'Comprador' : 'Vendedor'}
                    </h3>

                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        {otherUser.profile_pic ? (
                            <img
                                src={otherUser.profile_pic}
                                alt={otherUser.username}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <User className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {otherUser.first_name} {otherUser.last_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          @{otherUser.username}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2 text-yellow-500" />
                        {(() => {
                          const sellerStatus = formatSellerStatus(otherUser.seller_rating, otherUser.total_sales);
                          if (sellerStatus.isStarting) {
                            return (
                              <span>
                                Status: <span className="text-blue-600 font-medium">{sellerStatus.display}</span>
                                {sellerStatus.salesCount > 0 && ` (${sellerStatus.salesCount} ${sellerStatus.salesCount === 1 ? 'venda' : 'vendas'})`}
                              </span>
                            );
                          } else {
                            return (
                              <span>
                                Avaliação: {sellerStatus.display} ({sellerStatus.salesCount} vendas)
                              </span>
                            );
                          }
                        })()}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Membro desde {otherUser.created_at ? new Date(otherUser.created_at).getFullYear() : new Date().getFullYear()}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Link
                          to={`/users/${otherUser._id}`}
                          className="block w-full text-center"
                      >
                        <Button variant="outline" className="w-full">
                          Ver Perfil
                        </Button>
                      </Link>

                      <Button
                          className="w-full"
                          onClick={() => document.querySelector('.chat-input')?.focus()}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Enviar Mensagem
                      </Button>
                    </div>
                  </div>
              )}

              {/* Ações Disponíveis */}
              {(availableActions.length > 0 || canRate()) && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Ações Disponíveis
                    </h3>

                    <div className="space-y-3">
                      {availableActions.map((actionItem, index) => (
                          <div key={index}>
                            <Button
                                onClick={() => handleStatusUpdate(actionItem.action)}
                                disabled={updating}
                                variant={actionItem.color === 'danger' ? 'danger' : 'primary'}
                                className="w-full"
                            >
                              {updating ? 'Atualizando...' : actionItem.label}
                            </Button>
                            {actionItem.description && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {actionItem.description}
                                </p>
                            )}
                          </div>
                      ))}
                      
                      {/* Botão de Avaliação */}
                      {canRate() && (
                          <div>
                            <Button
                                onClick={() => setShowRatingModal(true)}
                                variant="primary"
                                className="w-full"
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Avaliar {getUserRole() === 'buyer' ? 'Vendedor' : 'Comprador'}
                            </Button>
                            <p className="text-xs text-gray-600 mt-1">
                              Compartilhe sua experiência com esta transação
                            </p>
                          </div>
                      )}
                    </div>
                  </div>
              )}

              {/* Informações do Pedido */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Detalhes do Pedido
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID do Pedido:</span>
                    <span className="font-mono">#{order._id?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data do Pedido:</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de Pagamento:</span>
                    <span>{order.payment_method || 'A combinar'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-green-600">
                      R$ {parseFloat(order.total_price || 0).toFixed(2)}
                    </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reportar Problema */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Suporte
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Problemas com este pedido?
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Flag className="w-4 h-4 mr-2" />
                  Reportar Problema
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Avaliação */}
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          order={order}
          onSuccess={handleRatingSuccess}
        />
      </div>
  );
};

export default OrderDetails;