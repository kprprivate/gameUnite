import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../../contexts/CartContext';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';

const Cart = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    loading, 
    updateCartItem, 
    removeFromCart, 
    clearCart, 
    validateCart 
  } = useCart();
  
  const [updating, setUpdating] = useState({});
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    // Validar carrinho ao entrar na página
    handleValidateCart();
  }, []);

  const handleUpdateQuantity = async (adId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(adId);
      return;
    }

    setUpdating(prev => ({ ...prev, [adId]: true }));
    
    try {
      await updateCartItem(adId, newQuantity);
    } catch (error) {
      toast.error('Erro ao atualizar quantidade');
    }
    
    setUpdating(prev => ({ ...prev, [adId]: false }));
  };

  const handleRemoveItem = async (adId) => {
    if (!window.confirm('Deseja remover este item do carrinho?')) {
      return;
    }

    setUpdating(prev => ({ ...prev, [adId]: true }));
    
    try {
      await removeFromCart(adId);
    } catch (error) {
      toast.error('Erro ao remover item');
    }
    
    setUpdating(prev => ({ ...prev, [adId]: false }));
  };

  const handleClearCart = async () => {
    if (!window.confirm('Deseja limpar todo o carrinho?')) {
      return;
    }

    try {
      await clearCart();
    } catch (error) {
      toast.error('Erro ao limpar carrinho');
    }
  };

  const handleValidateCart = async () => {
    setValidating(true);
    
    try {
      await validateCart();
    } catch (error) {
      toast.error('Erro ao validar carrinho');
    }
    
    setValidating(false);
  };

  const calculateTotal = () => {
    return cart.items.reduce((total, item) => {
      return total + (item.price_snapshot * item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <EmptyState
            icon={ShoppingCart}
            title="Seu carrinho está vazio"
            description="Adicione alguns jogos ao seu carrinho para continuar"
            actionText="Explorar Jogos"
            onAction={() => navigate('/games')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Meu Carrinho
            </h1>
            <p className="text-gray-600">
              {cart.items.length} {cart.items.length === 1 ? 'item' : 'itens'} no carrinho
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={handleValidateCart}
              loading={validating}
              variant="outline"
              size="sm"
              className="inline-flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Validar Carrinho
            </Button>

            {cart.items.length > 1 && (
              <Button
                onClick={handleClearCart}
                variant="danger"
                size="sm"
                className="inline-flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Carrinho
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de itens */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start space-x-4">
                  {/* Imagem */}
                  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.ad_snapshot?.image_url || '/placeholder-game.jpg'}
                      alt={item.ad_snapshot?.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Detalhes */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                      {item.ad_snapshot?.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.ad_snapshot?.game_name}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Plataforma: {item.ad_snapshot?.platform}</span>
                      <span>Estado: {item.ad_snapshot?.condition}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Vendedor: @{item.ad_snapshot?.seller_username}
                    </p>
                  </div>

                  {/* Preço e controles */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-green-600 mb-3">
                      R$ {item.price_snapshot?.toFixed(2)}
                    </div>

                    {/* Controles de quantidade */}
                    <div className="flex items-center space-x-2 mb-3">
                      <button
                        onClick={() => handleUpdateQuantity(item.ad_id, item.quantity - 1)}
                        disabled={updating[item.ad_id] || item.quantity <= 1}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      
                      <span className="w-12 text-center font-semibold">
                        {updating[item.ad_id] ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      
                      <button
                        onClick={() => handleUpdateQuantity(item.ad_id, item.quantity + 1)}
                        disabled={updating[item.ad_id]}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-sm text-gray-600 mb-3">
                      Subtotal: R$ {(item.price_snapshot * item.quantity).toFixed(2)}
                    </div>

                    {/* Botão remover */}
                    <button
                      onClick={() => handleRemoveItem(item.ad_id)}
                      disabled={updating[item.ad_id]}
                      className="text-sm text-red-600 hover:text-red-800 flex items-center disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remover
                    </button>
                  </div>
                </div>

                {/* Alerta de mudança de preço */}
                {item.price_changed && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        O preço deste item foi alterado para R$ {item.current_price?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Resumo do Pedido
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold">R$ {calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Itens ({cart.items.length}):</span>
                  <span>{cart.items.reduce((sum, item) => sum + item.quantity, 0)} unidades</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">R$ {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link to="/checkout">
                  <Button className="w-full inline-flex items-center justify-center" size="lg">
                    Finalizar Compra
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                
                <Link to="/games">
                  <Button variant="outline" className="w-full">
                    Continuar Comprando
                  </Button>
                </Link>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">💡 Dicas</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Frete combinado diretamente com o vendedor</li>
                  <li>• Pagamento seguro pela plataforma</li>
                  <li>• Chat em tempo real com os vendedores</li>
                  <li>• Suporte 24/7 para dúvidas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;