import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';
import {
  ArrowLeft,
  User,
  Package,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MessageCircle,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Star,
  AlertCircle
} from 'lucide-react';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const OrderDetails = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Estados do chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchOrderDetails();
    loadMockMessages(); // Carregar mensagens mockadas
  }, [orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchOrderDetails = async () => {
    setLoading(true);

    try {
      const result = await orderService.getOrder(orderId);
      if (result.success) {
        setOrder(result.data.order);
      } else {
        toast.error(result.message);
        navigate('/orders');
      }
    } catch (error) {
      toast.error('Erro ao carregar pedido');
      navigate('/orders');
    }

    setLoading(false);
  };

  // Mock de mensagens para demonstração
  const loadMockMessages = () => {
    const mockMessages = [
      {
        id: 1,
        sender_id: 'system',
        sender_name: 'Sistema',
        content: 'Pedido criado com sucesso! 🎉',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        is_system: true
      },
      {
        id: 2,
        sender_id: 'other_user',
        sender_name: 'João Silva',
        content: 'Olá! Obrigado pela compra. O jogo está em perfeito estado. Quando posso enviar?',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        is_system: false
      },
      {
        id: 3,
        sender_id: user?._id,
        sender_name: user?.first_name || 'Você',
        content: 'Perfeito! Pode enviar quando quiser. Qual o prazo de entrega?',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        is_system: false
      }
    ];
    setMessages(mockMessages);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!order) return;

    const confirmMessages = {
      paid: 'Confirmar que o pagamento foi realizado?',
      shipped: 'Confirmar que o produto foi enviado?',
      delivered: 'Confirmar que o produto foi recebido?',
      cancelled: 'Tem certeza que deseja cancelar este pedido?'
    };

    if (!window.confirm(confirmMessages[newStatus])) {
      return;
    }

    setUpdating(true);

    try {
      const result = await orderService.updateOrderStatus(orderId, newStatus);
      if (result.success) {
        toast.success(result.message);
        await fetchOrderDetails(); // Recarregar dados

        // Adicionar mensagem do sistema
        const systemMessage = {
          id: Date.now(),
          sender_id: 'system',
          sender_name: 'Sistema',
          content: `Status atualizado para: ${getStatusLabel(newStatus)} ✅`,
          timestamp: new Date().toISOString(),
          is_system: true
        };
        setMessages(prev => [...prev, systemMessage]);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }

    setUpdating(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);

    // Simular envio de mensagem
    const messageToSend = {
      id: Date.now(),
      sender_id: user?._id,
      sender_name: user?.first_name || 'Você',
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      is_system: false
    };

    try {
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 500));

      setMessages(prev => [...prev, messageToSend]);
      setNewMessage('');

      // Simular resposta automática do sistema
      setTimeout(() => {
        const autoReply = {
          id: Date.now() + 1,
          sender_id: 'system',
          sender_name: 'Sistema',
          content: '💬 Mensagem enviada! O chat estará disponível em breve.',
          timestamp: new Date().toISOString(),
          is_system: true
        };
        setMessages(prev => [...prev, autoReply]);
      }, 1000);

    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }

    setSendingMessage(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      paid: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      paid: CheckCircle,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-5 h-5" />;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Aguardando Pagamento',
      paid: 'Pago',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  const canUpdateStatus = (targetStatus) => {
    if (!order) return false;

    const isOwner = order.role === 'buyer' || order.role === 'seller';
    const currentStatus = order.status;

    // Regras de transição baseadas no papel do usuário
    if (order.role === 'buyer') {
      return (
        (currentStatus === 'pending' && targetStatus === 'paid') ||
        (currentStatus === 'shipped' && targetStatus === 'delivered') ||
        (currentStatus === 'pending' && targetStatus === 'cancelled')
      );
    } else if (order.role === 'seller') {
      return (
        (currentStatus === 'paid' && targetStatus === 'shipped') ||
        (currentStatus === 'pending' && targetStatus === 'cancelled')
      );
    }

    return false;
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Pedido não encontrado</h2>
          <Link to="/orders" className="text-blue-600 hover:text-blue-800">
            Voltar para Pedidos
          </Link>
        </div>
      </div>
    );
  }

  const isSellerView = order.role === 'seller';
  const otherUser = order.buyer || order.seller;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Pedidos
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Detalhes do Pedido
          </h1>
          <p className="text-gray-600">
            {isSellerView ? 'Venda' : 'Compra'} • {new Date(order.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status do Pedido */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Status do Pedido</h2>
                <div className={`flex items-center px-4 py-2 rounded-lg border ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-2 font-medium">{getStatusLabel(order.status)}</span>
                </div>
              </div>

              {/* Timeline de Status */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    ['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(order.status)
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">Pedido Criado</div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                {order.status !== 'pending' && (
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      ['paid', 'shipped', 'delivered'].includes(order.status)
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">Pagamento Confirmado</div>
                      <div className="text-sm text-gray-500">Aguardando envio</div>
                    </div>
                  </div>
                )}

                {['shipped', 'delivered'].includes(order.status) && (
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      ['shipped', 'delivered'].includes(order.status)
                        ? 'bg-purple-100 text-purple-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">Produto Enviado</div>
                      <div className="text-sm text-gray-500">Em trânsito</div>
                    </div>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">Pedido Entregue</div>
                      <div className="text-sm text-gray-500">Transação concluída</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ações do Status */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-3">
                  {canUpdateStatus('paid') && (
                    <Button
                      onClick={() => handleStatusUpdate('paid')}
                      disabled={updating}
                      size="sm"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Confirmar Pagamento
                    </Button>
                  )}

                  {canUpdateStatus('shipped') && (
                    <Button
                      onClick={() => handleStatusUpdate('shipped')}
                      disabled={updating}
                      size="sm"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Marcar como Enviado
                    </Button>
                  )}

                  {canUpdateStatus('delivered') && (
                    <Button
                      onClick={() => handleStatusUpdate('delivered')}
                      disabled={updating}
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Recebimento
                    </Button>
                  )}

                  {canUpdateStatus('cancelled') && (
                    <Button
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={updating}
                      variant="danger"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar Pedido
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Detalhes do Produto */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalhes do Produto</h2>

              <div className="flex items-start space-x-4">
                {order.ad_snapshot?.image_url && (
                  <img
                    src={order.ad_snapshot.image_url}
                    alt={order.ad_snapshot.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {order.ad_snapshot?.title}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><strong>Jogo:</strong> {order.ad_snapshot?.game_name}</p>
                    <p><strong>Plataforma:</strong> {order.ad_snapshot?.platform}</p>
                    <p><strong>Estado:</strong> {order.ad_snapshot?.condition}</p>
                    <p><strong>Quantidade:</strong> {order.quantity}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-600">Preço unitário</div>
                  <div className="text-lg font-medium text-gray-900">
                    R$ {order.unit_price?.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Total</div>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {order.total_price?.toFixed(2)}
                  </div>
                </div>
              </div>

              {order.ad_snapshot?.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Descrição</h4>
                  <p className="text-gray-700 text-sm">{order.ad_snapshot.description}</p>
                </div>
              )}
            </div>

            {/* Chat */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat do Pedido
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Converse com {isSellerView ? 'o comprador' : 'o vendedor'} sobre este pedido
                </p>
              </div>

              {/* Mensagens */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user?._id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.is_system
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : message.sender_id === user?._id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {!message.is_system && message.sender_id !== user?._id && (
                        <div className="text-xs font-medium mb-1">{message.sender_name}</div>
                      )}
                      <div className="text-sm">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.is_system 
                          ? 'text-blue-600' 
                          : message.sender_id === user?._id 
                          ? 'text-blue-100' 
                          : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="border-t border-gray-200 p-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">
                      💬 Chat em desenvolvimento - Mensagens são apenas demonstrativas
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    loading={sendingMessage}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Informações do Contato */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {isSellerView ? 'Comprador' : 'Vendedor'}
              </h3>

              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                  {otherUser?.profile_pic ? (
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
                  <p className="font-medium text-gray-800">
                    {otherUser?.first_name} {otherUser?.last_name}
                  </p>
                  <p className="text-sm text-gray-600">@{otherUser?.username}</p>
                </div>
              </div>

              {isSellerView && otherUser?.seller_rating && (
                <div className="flex items-center mb-4">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium">
                    {otherUser.seller_rating.toFixed(1)} como vendedor
                  </span>
                </div>
              )}

              <div className="space-y-3">
                <Link
                  to={`/users/${otherUser?._id}`}
                  className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Perfil Completo
                </Link>
              </div>
            </div>

            {/* Endereço de Entrega */}
            {order.shipping_address && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Endereço de Entrega
                </h3>

                <div className="text-sm text-gray-700 space-y-1">
                  <p>{order.shipping_address.street}, {order.shipping_address.number}</p>
                  {order.shipping_address.complement && (
                    <p>{order.shipping_address.complement}</p>
                  )}
                  <p>{order.shipping_address.neighborhood}</p>
                  <p>{order.shipping_address.city} - {order.shipping_address.state}</p>
                  <p>CEP: {order.shipping_address.zipcode}</p>
                </div>
              </div>
            )}

            {/* Resumo Financeiro */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo Financeiro</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Preço unitário:</span>
                  <span className="font-medium">R$ {order.unit_price?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantidade:</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">R$ {order.total_price?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {order.total_price?.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  💡 Frete e taxas são combinados diretamente entre comprador e vendedor
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;