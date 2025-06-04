// Cart.jsx - VERSÃO OTIMIZADA
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { cartUtils } from '../../utils/cartUtils';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Package,
  RefreshCw,
  CreditCard,
  Shield
} from 'lucide-react';
import Button from '../../components/Common/Button';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';

// Componentes essenciais mantidos
const CartItemImage = ({ imageUrl, title }) => (
  <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
    {imageUrl ? (
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center">
        <Package className="w-8 h-8 text-gray-400" />
      </div>
    )}
  </div>
);

const QuantityControls = ({ item, onUpdateQuantity, updating }) => (
  <div className="flex items-center space-x-2">
    <button
      onClick={() => onUpdateQuantity(item.ad_id, item.quantity - 1)}
      disabled={item.quantity <= 1 || updating[item.ad_id]}
      className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
    >
      <Minus className="w-4 h-4" />
    </button>

    <span className="px-3 py-1 border rounded bg-gray-50 min-w-[3rem] text-center">
      {updating[item.ad_id] ? (
        <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
      ) : (
        item.quantity
      )}
    </span>

    <button
      onClick={() => onUpdateQuantity(item.ad_id, item.quantity + 1)}
      disabled={updating[item.ad_id]}
      className="p-1 border border-gray-300 rounded hover:bg-gray-50"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
);

const CartItem = ({ item, onUpdateQuantity, onRemoveItem, updating }) => (
  <div className="p-6">
    <div className="flex items-start space-x-4">
      <CartItemImage imageUrl={item.image_url} title={item.title} />

      <div className="flex-1">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {item.title}
            </h3>
            <p className="text-sm text-gray-600">
              {item.game_name} • {item.platform}
            </p>
            <p className="text-sm text-gray-500">
              Por: {item.seller_name}
            </p>
          </div>

          <button
            onClick={() => onRemoveItem(item.ad_id, item.title)}
            disabled={updating[item.ad_id]}
            className="text-red-600 hover:text-red-800 p-1"
            title="Remover"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-between items-center">
          <QuantityControls
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            updating={updating}
          />

          <div className="text-right">
            <div className="text-xl font-bold text-gray-900">
              R$ {(item.price * item.quantity).toFixed(2)}
            </div>
            {item.quantity > 1 && (
              <div className="text-sm text-gray-500">
                R$ {item.price.toFixed(2)} cada
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CartSummary = ({ cartItems, onProceedToCheckout, isAuthenticated }) => {
  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const uniqueSellers = [...new Set(cartItems.map(item => item.seller_id))].length;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
      <h2 className="text-xl font-semibold mb-6">Resumo</h2>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({getTotalItems()} itens)</span>
          <span>R$ {getSubtotal().toFixed(2)}</span>
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold">Total</span>
            <span className="text-2xl font-bold text-green-600">
              R$ {getSubtotal().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {uniqueSellers > 1 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ Você tem itens de {uniqueSellers} vendedores - serão pedidos separados
          </p>
        </div>
      )}

      <Button
        onClick={onProceedToCheckout}
        className="w-full mb-4"
        size="lg"
      >
        <CreditCard className="w-5 h-5 mr-2" />
        Finalizar Compra
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {!isAuthenticated && (
        <p className="text-sm text-center text-gray-500 mb-4">
          É necessário fazer login para continuar
        </p>
      )}

      {/* Informação de segurança simplificada */}
      <div className="flex items-center justify-center text-sm text-gray-500 pt-4 border-t">
        <Shield className="w-4 h-4 mr-2" />
        Compra 100% segura
      </div>
    </div>
  );
};

// Componente principal simplificado
const Cart = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    loadCartItems();
  }, []);

  useEffect(() => {
    const handleCartUpdate = () => loadCartItems();
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const loadCartItems = () => {
    try {
      setLoading(true);
      cartUtils.cleanInvalidItems();
      const items = cartUtils.getCartItems();
      setCartItems(items);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      toast.error('Erro ao carregar carrinho');
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (adId, newQuantity) => {
    if (updating[adId]) return;

    try {
      setUpdating(prev => ({ ...prev, [adId]: true }));
      const result = cartUtils.updateQuantity(adId, newQuantity);

      if (result.success) {
        loadCartItems();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      toast.error('Erro ao atualizar quantidade');
    } finally {
      setUpdating(prev => ({ ...prev, [adId]: false }));
    }
  };

  const handleRemoveItem = async (adId, title) => {
    if (updating[adId] || !window.confirm(`Remover "${title}" do carrinho?`)) return;

    try {
      setUpdating(prev => ({ ...prev, [adId]: true }));
      const result = cartUtils.removeFromCart(adId);

      if (result.success) {
        toast.success('Item removido');
        loadCartItems();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast.error('Erro ao remover item');
    } finally {
      setUpdating(prev => ({ ...prev, [adId]: false }));
    }
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Faça login para finalizar a compra');
      navigate('/login', { state: { from: { pathname: '/cart' } } });
      return;
    }

    const validation = cartUtils.validateCart();
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <EmptyState
            icon={ShoppingCart}
            title="Seu carrinho está vazio"
            description="Explore nossos jogos e adicione ao carrinho."
            actionText="Ver Jogos"
            onAction={() => navigate('/games')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header simplificado */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Carrinho
          </h1>
          <p className="text-gray-600">
            {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'itens'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de Itens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="divide-y">
                {cartItems.map((item) => (
                  <CartItem
                    key={item.ad_id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    updating={updating}
                  />
                ))}
              </div>

              {/* Footer simples */}
              <div className="p-4 bg-gray-50 border-t">
                <Link
                  to="/games"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  ← Continuar comprando
                </Link>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <CartSummary
              cartItems={cartItems}
              onProceedToCheckout={handleProceedToCheckout}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
