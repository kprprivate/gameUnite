// front/src/pages/Cart/Checkout.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';
import { cartUtils } from '../../utils/cartUtils';
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
  ShoppingCart
} from 'lucide-react';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const loadAndValidateCart = () => {
    setPageLoading(true);

    try {
      // Limpar itens inválidos primeiro
      cartUtils.cleanInvalidItems();

      // Carregar itens do carrinho
      const items = cartUtils.getCartItems();

      if (items.length === 0) {
        toast.error('Carrinho vazio');
        navigate('/cart');
        return;
      }

      // Validar carrinho
      const validation = cartUtils.validateCart();
      setCartValidation(validation);

      if (!validation.valid) {
        toast.error(validation.message);
        navigate('/cart');
        return;
      }

      setCartItems(items);

      console.log('Checkout carregado:', { items, validation });
    } catch (error) {
      console.error('Erro ao carregar checkout:', error);
      toast.error('Erro ao carregar dados do checkout');
      navigate('/cart');
    } finally {
      setPageLoading(false);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getUniqueSellerCount = () => {
    const sellers = new Set(cartItems.map(item => item.seller_id));
    return sellers.size;
  };

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      // Validar carrinho novamente antes do envio
      const validation = cartUtils.validateCart();
      if (!validation.valid) {
        toast.error(validation.message);
        navigate('/cart');
        return;
      }

      // Preparar dados do checkout
      const checkoutData = {
        cart_items: cartItems.map(item => ({
          ad_id: item.ad_id,
          quantity: item.quantity,
          notes: `Pedido via carrinho - ${item.title}`
        })),
        shipping_address: {
          street: data.street,
          number: data.number,
          complement: data.complement || '',
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipcode: data.zipcode,
          country: 'Brasil'
        },
        contact: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone
        },
        payment_method: data.payment_method || 'pending'
      };

      console.log('Enviando checkout:', checkoutData);

      const result = await orderService.checkout(checkoutData);

      if (result.success) {
        // Limpar carrinho
        cartUtils.clearCart();

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
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (cartItems.length === 0) {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Carrinho
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Finalizar Compra
          </h1>
          <p className="text-gray-600">
            {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'} • Total: R$ {getTotalPrice().toFixed(2)}
          </p>
        </div>

        {/* Avisos importantes */}
        {cartValidation && !cartValidation.valid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">
                Problema no carrinho: {cartValidation.message}
              </span>
            </div>
          </div>
        )}

        {getUniqueSellerCount() > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
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
          {/* Formulário */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Informações de Contato */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Informações de Contato
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      {...register('first_name', { required: 'Nome é obrigatório' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sobrenome *
                    </label>
                    <input
                      {...register('last_name', { required: 'Sobrenome é obrigatório' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        {...register('email', {
                          required: 'Email é obrigatório',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
                          }
                        })}
                        type="email"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        {...register('phone', { required: 'Telefone é obrigatório' })}
                        type="tel"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Endereço de Entrega */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Endereço de Entrega
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP *
                    </label>
                    <input
                      {...register('zipcode', { required: 'CEP é obrigatório' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="00000-000"
                    />
                    {errors.zipcode && (
                      <p className="mt-1 text-sm text-red-600">{errors.zipcode.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rua *
                    </label>
                    <input
                      {...register('street', { required: 'Rua é obrigatória' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.street && (
                      <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número *
                    </label>
                    <input
                      {...register('number', { required: 'Número é obrigatório' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.number && (
                      <p className="mt-1 text-sm text-red-600">{errors.number.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Complemento
                    </label>
                    <input
                      {...register('complement')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Apto, bloco, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro *
                    </label>
                    <input
                      {...register('neighborhood', { required: 'Bairro é obrigatório' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.neighborhood && (
                      <p className="mt-1 text-sm text-red-600">{errors.neighborhood.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade *
                    </label>
                    <input
                      {...register('city', { required: 'Cidade é obrigatória' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
                    <input
                      {...register('state', { required: 'Estado é obrigatório' })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SP"
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Método de Pagamento
                </h2>

                <div className="space-y-4">
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        {...register('payment_method')}
                        type="radio"
                        value="pending"
                        defaultChecked
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-yellow-800">
                          💰 Pagamento Pendente
                        </div>
                        <div className="text-sm text-yellow-700">
                          O pagamento será combinado diretamente com cada vendedor após a confirmação do pedido
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg opacity-50">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        disabled
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-600">
                          💳 Cartão de Crédito
                        </div>
                        <div className="text-sm text-gray-500">
                          Em breve - Gateway de pagamento em desenvolvimento
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 bg-gray-50 rounded-lg opacity-50">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        disabled
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-600">
                          🔑 PIX
                        </div>
                        <div className="text-sm text-gray-500">
                          Em breve - Pagamento via PIX
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de finalizar */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full inline-flex items-center justify-center"
                  size="lg"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Finalizar Pedido{getUniqueSellerCount() > 1 ? 's' : ''}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Ao finalizar, você concorda com nossos termos de uso e política de privacidade
                </p>
              </div>
            </form>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Resumo do Pedido
              </h2>

              {/* Lista de itens */}
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.ad_id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.game_name} • Qtd: {item.quantity}
                      </p>
                      <p className="text-xs text-gray-500">
                        Por: {item.seller_name}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totais */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({getTotalItems()} itens):</span>
                  <span className="font-medium">R$ {getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frete:</span>
                  <span className="font-medium">A combinar</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {getTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Informações de segurança */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <Lock className="w-4 h-4 text-green-600 mr-2" />
                  <span className="font-medium text-green-900">Compra Protegida</span>
                </div>
                <p className="text-sm text-green-700">
                  Seus dados estão seguros e você pode cancelar o pedido antes do pagamento.
                </p>
              </div>

              {/* Resumo dos vendedores */}
              {getUniqueSellerCount() > 1 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <User className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-900">
                      {getUniqueSellerCount()} Vendedores
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Serão criados {getUniqueSellerCount()} pedidos separados, um para cada vendedor.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;