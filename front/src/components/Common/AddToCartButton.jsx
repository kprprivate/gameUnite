// front/src/components/Common/AddToCartButton.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { cartUtils } from '../../utils/cartUtils';
import Button from './Button';

const AddToCartButton = ({
  ad,
  quantity = 1,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'primary',
  showIcon = true,
  onAddToCart,
  validateOwnership = true
}) => {
  const { isAuthenticated, user } = useAuth();
  const [isInCart, setIsInCart] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ad?._id) {
      setIsInCart(cartUtils.isInCart(ad._id));
    }
  }, [ad?._id]);

  // Listener para mudanças no carrinho
  useEffect(() => {
    const handleCartUpdate = () => {
      if (ad?._id) {
        setIsInCart(cartUtils.isInCart(ad._id));
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, [ad?._id]);

  const validateAdForCart = () => {
    // Verificar se o anúncio existe
    if (!ad || !ad._id) {
      return { valid: false, message: 'Dados do anúncio inválidos' };
    }

    // Verificar se é anúncio de venda
    if (ad.ad_type !== 'venda') {
      return { valid: false, message: 'Apenas anúncios de venda podem ser adicionados ao carrinho' };
    }

    // Verificar se tem preço válido
    if (!ad.price || ad.price <= 0) {
      return { valid: false, message: 'Este anúncio não possui preço válido' };
    }

    // Verificar se o usuário está logado
    if (!isAuthenticated) {
      return { valid: false, message: 'Faça login para adicionar ao carrinho' };
    }

    // Verificar se não é o próprio anúncio (se validação estiver habilitada)
    if (validateOwnership && user && (ad.user_id === user._id || ad.user?._id === user._id)) {
      return { valid: false, message: 'Você não pode adicionar seu próprio anúncio ao carrinho' };
    }

    return { valid: true };
  };

  const handleAddToCart = async () => {
    if (loading) return;

    setLoading(true);

    try {
      // Validar anúncio
      const validation = validateAdForCart();
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }

      // Adicionar ao carrinho
      const result = cartUtils.addToCart(ad, quantity);

      if (result.success) {
        setIsInCart(true);
        toast.success(result.message);

        // Callback opcional
        if (onAddToCart) {
          onAddToCart(ad, quantity);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro interno ao adicionar ao carrinho');
    } finally {
      setLoading(false);
    }
  };

  // Se já está no carrinho, mostrar botão diferente
  if (isInCart) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`border-green-500 text-green-600 hover:border-green-600 hover:text-green-700 ${className}`}
        disabled
      >
        {showIcon && <Check className="w-4 h-4 mr-2" />}
        No Carrinho
      </Button>
    );
  }

  // Verificar se pode mostrar o botão
  const validation = validateAdForCart();

  // Se não pode adicionar por motivo que não seja autenticação, não mostrar botão
  if (!validation.valid && validation.message !== 'Faça login para adicionar ao carrinho') {
    return (
      <Button
        variant="outline"
        size={size}
        className={`border-gray-300 text-gray-500 cursor-not-allowed ${className}`}
        disabled
        title={validation.message}
      >
        {showIcon && <AlertCircle className="w-4 h-4 mr-2" />}
        Indisponível
      </Button>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || loading}
      loading={loading}
      title={!isAuthenticated ? 'Faça login para adicionar ao carrinho' : 'Adicionar ao carrinho'}
    >
      {showIcon && <ShoppingCart className="w-4 h-4 mr-2" />}
      {!isAuthenticated ? 'Login para Comprar' : 'Adicionar ao Carrinho'}
    </Button>
  );
};

export default AddToCartButton;