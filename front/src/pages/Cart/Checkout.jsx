// front/src/pages/Cart/Checkout.jsx - CORREÇÃO DO RESUMO DO CARRINHO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { orderService } from '../../services/orderService';
import {
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  Lock,
  CheckCircle,
  ArrowLeft,
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Star,
  Shield
} from 'lucide-react';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cart, clearCart, validateCart, loadCart } = useCart();

  const [processing, setProcessing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [cartValidation, setCartValidation] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    }
  });

  useEffect(() => {
    loadAndValidateCart();
  }, []);

  const loadAndValidateCart = async () => {
    setPageLoading(true);

    try {
      // CORREÇÃO: Forçar recarregamento do carrinho primeiro
      await loadCart();

      // Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verificar se há itens no carrinho
      if (!cart.items || cart.items.length === 0) {
        toast.error('Carrinho vazio');
        navigate('/cart');
        return;
      }

      // Validar carrinho
      const validation = await validateCart();
      setCartValidation(validation);

      if (validation.success && validation.data.total_invalid > 0) {
        toast.warning(`${validation.data.total_invalid} item(s) removido(s) (não disponível)`);
      }

    } catch (error) {
      console.error('Erro ao carregar checkout:', error);
      toast.error('Erro ao carregar dados do checkout');
      navigate('/cart');
    } finally {
      setPageLoading(false);
    }
  };

  // CORREÇÃO: Função melhorada para calcular total
  const getTotalPrice = () => {
    if (!cart?.items || !Array.isArray(cart.items)) return 0;

    return cart.items.reduce((total, item) => {
      const price = item.price_snapshot || item.price || 0;
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

  // CORREÇÃO: Função melhorada para calcular total de itens
  const getTotalItems = () => {
    if (!cart?.items || !Array.isArray(cart.items)) return 0;

    return cart.items.reduce((total, item) => {
      return total + (item.quantity || 0);
    }, 0);
  };

  // CORREÇÃO: Função melhorada para contar vendedores únicos
  const getUniqueSellerCount = () => {
    if (!cart?.items || !Array.isArray(cart.items)) return 0;

    const sellers = new Set();
    cart.items.forEach(item => {
      const sellerId = item.ad_snapshot?.seller_id || item.seller_id;
      if (sellerId) {
        sellers.add(sellerId);
      }
    });

    return sellers.size;
  };

  const onSubmit = async (data) => {
    if (!cart.items || cart.items.length === 0) {
      toast.error('Carrinho está vazio');
      return;
    }

    setProcessing(true);

    try {
      // CORREÇÃO: Preparar dados do checkout com melhor estrutura
      const checkoutData = {
        cart_items: cart.items.map(item => ({
          ad_id: item.ad_id,
          quantity: item.quantity,
          title: item.ad_snapshot?.title || 'Item sem título'
        })),
        shipping_address: {
          street: data.street,
          number: data.number,
          complement: data.complement || '',
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipcode: data.zipcode.replace(/\D/g, ''), // Remove formatação
          country: 'Brasil'
        },
        contact: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone.replace(/\D/g, '') // Remove formatação
        },
        payment_method: data.payment_method || 'pending'
      };

      console.log('Enviando checkout:', checkoutData);

      const result = await orderService.processCheckout(checkoutData);

      if (result.success) {
        // Limpar carrinho
        await clearCart();

        toast.success('Pedidos criados com sucesso!');
        navigate('/orders', {
          state: {
            message: 'Seus pedidos foram criados com sucesso!',
            orders: result.data.orders || result.orders
          }
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      toast.error('Erro ao processar pedidos');
    } finally {
      setProcessing(false);
    }
  };

  // Validações Regex
  const validationRules = {
    email: {
      required: 'Email é obrigatório',
      pattern: {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Email inválido'
      }
    },
    phone: {
      required: 'Telefone é obrigatório',
      pattern: {
        value: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
        message: 'Formato: (11) 99999-9999'
      }
    },
    zipcode: {
      required: 'CEP é obrigatório',
      pattern: {
        value: /^\d{5}-?\d{3}$/,
        message: 'Formato: 00000-000'
      }
    },
    name: {
      required: 'Nome é obrigatório',
      pattern: {
        value: /^[A-Za-zÀ-ÿ\s]{2,}$/,
        message: 'Apenas letras, mínimo 2 caracteres'
      }
    },
    state: {
      required: 'Estado é obrigatório',
      pattern: {
        value: /^[A-Z]{2}$/,
        message: 'Use a sigla (ex: SP, RJ)'
      }
    }
  };

  // Formatação automática
  const formatPhone = (value) => {
    if (!value) return value;
    const phone = value.replace(/\D/g, '');
    const match = phone.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const formatZipcode = (value) => {
    if (!value) return value;
    const zip = value.replace(/\D/g, '');
    const match = zip.match(/^(\d{5})(\d{3})$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    return value;
  };

  if (pageLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Carrinho vazio</h2>
            <p className="text-gray-600 mb-6">Adicione alguns jogos ao seu carrinho para continuar.</p>
            <Button onClick={() => navigate('/games')}>
              Explorar Jogos
            </Button>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <button
                onClick={() => navigate('/cart')}
                className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Carrinho
            </button>

            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🎯 Finalizar Compra
              </h1>
              <p className="text-lg text-gray-600">
                {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'} •
                <span className="font-semibold text-green-600 ml-2">
                Total: R$ {getTotalPrice().toFixed(2)}
              </span>
              </p>
            </div>
          </div>

          {/* Avisos importantes */}
          {cartValidation && cartValidation.data?.total_invalid > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">
                Alguns itens foram removidos do carrinho por não estarem mais disponíveis.
              </span>
                </div>
              </div>
          )}

          {getUniqueSellerCount() > 1 && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg shadow-sm">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-blue-600 mr-2" />
                  <div className="text-blue-800">
                <span className="font-medium">
                  Múltiplos vendedores detectados!
                </span>
                    <p className="text-sm mt-1">
                      Seus itens serão divididos em {getUniqueSellerCount()} pedidos separados, um para cada vendedor.
                    </p>
                  </div>
                </div>
              </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário Principal */}
            <div className="lg:col-span-2 space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Informações de Contato */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <User className="w-6 h-6 mr-3 text-blue-600" />
                    Informações de Contato
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nome *
                      </label>
                      <input
                          {...register('first_name', validationRules.name)}
                          type="text"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                              errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="Seu primeiro nome"
                      />
                      {errors.first_name && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {errors.first_name.message}
                          </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Sobrenome *
                      </label>
                      <input
                          {...register('last_name', validationRules.name)}
                          type="text"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                              errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="Seu sobrenome"
                      />
                      {errors.last_name && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {errors.last_name.message}
                          </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            {...register('email', validationRules.email)}
                            type="email"
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                            }`}
                            placeholder="seu@email.com"
                        />
                      </div>
                      {errors.email && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {errors.email.message}
                          </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Telefone *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            {...register('phone', validationRules.phone)}
                            type="tel"
                            className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                            }`}
                            placeholder="(11) 99999-9999"
                            onChange={(e) => {
                              e.target.value = formatPhone(e.target.value);
                            }}
                        />
                      </div>
                      {errors.phone && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {errors.phone.message}
                          </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Endereço de Entrega */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <MapPin className="w-6 h-6 mr-3 text-green-600" />
                    Endereço de Entrega
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CEP *
                      </label>
                      <input
                          {...register('zipcode', validationRules.zipcode)}
                          type="text"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                              errors.zipcode ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-green-500'
                          }`}
                          placeholder="00000-000"
                          onChange={(e) => {
                            e.target.value = formatZipcode(e.target.value);
                          }}
                      />
                      {errors.zipcode && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {errors.zipcode.message}
                          </p>
                      )}
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Estado *
                      </label>
                      <input
                          {...register('state', validationRules.state)}
                          type="text"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                              errors.state ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-green-500'
                          }`}
                          placeholder="SP"
                          maxLength={2}
                          style={{ textTransform: 'uppercase' }}
                      />
                      {errors.state && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {errors.state.message}
                          </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Rua *
                      </label>
                      <input
                          {...register('street', { required: 'Rua é obrigatória' })}
                          type="text"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                              errors.street ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-green-500'
                          }`}
                          placeholder="Nome da rua"
                      />
                      {errors.street && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {errors.street.message}
                          </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Número *
                      </label>
                      <input
                          {...register('number', { required: 'Número é obrigatório' })}
                          type="text"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                              errors.number ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-green-500'
                          }`}
                          placeholder="123"
                      />
                      {errors.number && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {errors.number.message}
                          </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Complemento
                      </label>
                      <input
                          {...register('complement')}
                          type="text"
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          placeholder="Apto, bloco, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Bairro *
                      </label>
                      <input
                          {...register('neighborhood', { required: 'Bairro é obrigatório' })}
                          type="text"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                              errors.neighborhood ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-green-500'
                          }`}
                          placeholder="Nome do bairro"
                      />
                      {errors.neighborhood && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {errors.neighborhood.message}
                          </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cidade *
                      </label>
                      <input
                          {...register('city', { required: 'Cidade é obrigatória' })}
                          type="text"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                              errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-green-500'
                          }`}
                          placeholder="Nome da cidade"
                      />
                      {errors.city && (
                          <p className="mt-2 text-sm text-red-600 flex items-center">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {errors.city.message}
                          </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Método de Pagamento */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                    <CreditCard className="w-6 h-6 mr-3 text-purple-600" />
                    Método de Pagamento
                  </h2>

                  <div className="space-y-4">
                    <div className="p-6 border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                      <div className="flex items-center">
                        <input
                            {...register('payment_method')}
                            type="radio"
                            value="pending"
                            defaultChecked
                            className="mr-4 w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-yellow-800 text-lg flex items-center">
                            <DollarSign className="w-5 h-5 mr-2" />
                            Pagamento Pendente
                          </div>
                          <div className="text-sm text-yellow-700 mt-1">
                            O pagamento será combinado diretamente com cada vendedor após a confirmação do pedido
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border-2 border-gray-200 bg-gray-50 rounded-xl opacity-50">
                      <div className="flex items-center">
                        <input
                            type="radio"
                            disabled
                            className="mr-4 w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-600 text-lg flex items-center">
                            <CreditCard className="w-5 h-5 mr-2" />
                            Cartão de Crédito
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Em breve - Gateway de pagamento em desenvolvimento
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border-2 border-gray-200 bg-gray-50 rounded-xl opacity-50">
                      <div className="flex items-center">
                        <input
                            type="radio"
                            disabled
                            className="mr-4 w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-600 text-lg flex items-center">
                            <Package className="w-5 h-5 mr-2" />
                            PIX
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Em breve - Pagamento via PIX
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão de finalizar */}
                <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl shadow-lg p-6">
                  <Button
                      type="submit"
                      loading={processing}
                      className="w-full bg-white text-gray-800 hover:bg-gray-100 font-bold text-lg py-4 shadow-lg"
                      size="lg"
                  >
                    <Lock className="w-5 h-5 mr-3" />
                    Finalizar Pedido{getUniqueSellerCount() > 1 ? 's' : ''} - R$ {getTotalPrice().toFixed(2)}
                  </Button>
                  <p className="text-white text-center text-sm mt-3 opacity-90">
                    🔒 Transação 100% segura • Seus dados estão protegidos
                  </p>
                </div>
              </form>
            </div>

            {/* Sidebar do Resumo - CORRIGIDA */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8 border border-gray-100">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  <ShoppingCart className="w-6 h-6 mr-3 text-blue-600" />
                  Resumo do Pedido
                </h2>

                {/* CORREÇÃO: Lista de itens com verificações de segurança */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {cart?.items && Array.isArray(cart.items) && cart.items.length > 0 ? (
                      cart.items.map((item) => (
                          <div key={item.ad_id || item._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              {item.ad_snapshot?.image_url || item.image_url ? (
                                  <img
                                      src={item.ad_snapshot?.image_url || item.image_url}
                                      alt={item.ad_snapshot?.title || item.title}
                                      className="w-full h-full object-cover"
                                  />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-8 h-8 text-gray-400" />
                                  </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {item.ad_snapshot?.title || item.title || 'Item sem título'}
                              </p>
                              <p className="text-xs text-gray-600">
                                {item.ad_snapshot?.game_name || item.game_name || 'Jogo não identificado'} • Qtd: {item.quantity || 1}
                              </p>
                              <p className="text-xs text-gray-500">
                                Por: {item.ad_snapshot?.seller_username || item.seller_name || 'Vendedor'}
                              </p>
                              <p className="text-sm font-semibold text-green-600 mt-1">
                                R$ {((item.price_snapshot || item.price || 0) * (item.quantity || 1)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-4">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Nenhum item no carrinho</p>
                      </div>
                  )}
                </div>

                {/* Totais */}
                <div className="space-y-3 border-t border-gray-200 pt-6">
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600">Subtotal ({getTotalItems()} itens):</span>
                    <span className="font-semibold">R$ {getTotalPrice().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frete:</span>
                    <span className="font-semibold text-blue-600">A combinar</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-xl font-bold text-gray-900">Total:</span>
                    <span className="text-3xl font-bold text-green-600">
                    R$ {getTotalPrice().toFixed(2)}
                  </span>
                  </div>
                </div>

                {/* Informações de segurança */}
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <div className="flex items-center mb-2">
                    <Shield className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-semibold text-green-900">Compra Protegida</span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Dados seguros e criptografados
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Chat direto com vendedores
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Suporte 24/7 disponível
                    </li>
                  </ul>
                </div>

                {/* Resumo dos vendedores */}
                {getUniqueSellerCount() > 1 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center mb-2">
                        <User className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-semibold text-blue-900">
                      {getUniqueSellerCount()} Vendedores
                    </span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Serão criados {getUniqueSellerCount()} pedidos separados, um para cada vendedor.
                      </p>
                    </div>
                )}

                {/* Avaliações */}
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center mb-2">
                    <Star className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="font-semibold text-yellow-900">Vendedores Verificados</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Todos os vendedores são verificados e têm avaliações positivas na plataforma.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Checkout;