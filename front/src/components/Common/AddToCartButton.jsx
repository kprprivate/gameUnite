// front/src/components/Common/AddToCartButton.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-toastify';
import Button from './Button';

const AddToCartButton = ({
                           ad,
                           className = '',
                           size = 'md',
                           variant = 'primary',
                           showQuantity = true,
                           maxQuantity = 10
                         }) => {
  const { isAuthenticated, user } = useAuth();
  const { isInCart, getCartItemQuantity, addToCart, updateCartItem, removeFromCart } = useCart();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuantity, setCurrentQuantity] = useState(0);
  const [inCart, setInCart] = useState(false);

  // Verificar se anúncio é válido e se pode ser adicionado ao carrinho
  const canAddToCart = React.useMemo(() => {
    if (!ad) return false;
    if (!isAuthenticated) return false;
    if (ad.ad_type !== 'venda') return false;
    if (ad.status !== 'active') return false;
    if (user && (user._id === ad.user_id || user._id === ad.user?._id)) return false;
    return true;
  }, [ad, isAuthenticated, user]);

  // Atualizar estado quando carrinho mudar
  useEffect(() => {
    if (ad?._id && isAuthenticated) {
      const itemInCart = isInCart(ad._id);
      const quantity = getCartItemQuantity(ad._id);

      console.log('🔄 Atualizando estado AddToCartButton:', {
        adId: ad._id,
        itemInCart,
        quantity,
        canAddToCart
      });

      setInCart(itemInCart);
      setCurrentQuantity(quantity);
    } else {
      setInCart(false);
      setCurrentQuantity(0);
    }
  }, [ad?._id, isAuthenticated, isInCart, getCartItemQuantity]);

  // Adicionar ao carrinho
  const handleAddToCart = async () => {
    if (!canAddToCart) {
      if (!isAuthenticated) {
        toast.info('Faça login para adicionar itens ao carrinho');
      } else if (ad.ad_type !== 'venda') {
        toast.info('Apenas anúncios de venda podem ser adicionados ao carrinho');
      } else if (user && (user._id === ad.user_id || user._id === ad.user?._id)) {
        toast.info('Você não pode adicionar seu próprio anúncio ao carrinho');
      } else {
        toast.info('Este item não pode ser adicionado ao carrinho');
      }
      return;
    }

    setIsProcessing(true);

    try {
      const result = await addToCart(ad, 1);

      if (result.success) {
        // O estado será atualizado automaticamente pelo useEffect
        console.log('✅ Item adicionado ao carrinho');
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho');
    }

    setIsProcessing(false);
  };

  // Atualizar quantidade
  const handleUpdateQuantity = async (newQuantity) => {
    if (newQuantity < 0 || newQuantity > maxQuantity) return;

    setIsProcessing(true);

    try {
      if (newQuantity === 0) {
        const result = await removeFromCart(ad._id);
        if (result.success) {
          console.log('✅ Item removido do carrinho');
        }
      } else {
        const result = await updateCartItem(ad._id, newQuantity);
        if (result.success) {
          console.log('✅ Quantidade atualizada');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar quantidade:', error);
      toast.error('Erro ao atualizar quantidade');
    }

    setIsProcessing(false);
  };

  // Remover do carrinho
  const handleRemoveFromCart = async () => {
    setIsProcessing(true);

    try {
      const result = await removeFromCart(ad._id);
      if (result.success) {
        console.log('✅ Item removido do carrinho');
      }
    } catch (error) {
      console.error('❌ Erro ao remover do carrinho:', error);
      toast.error('Erro ao remover do carrinho');
    }

    setIsProcessing(false);
  };

  // Não renderizar se não pode adicionar ao carrinho
  if (!canAddToCart) {
    if (!isAuthenticated) {
      return (
          <Button
              onClick={() => toast.info('Faça login para adicionar ao carrinho')}
              variant="outline"
              size={size}
              className={className}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Faça Login
          </Button>
      );
    }

    if (user && (user._id === ad?.user_id || user._id === ad?.user?._id)) {
      return (
          <Button
              disabled
              variant="outline"
              size={size}
              className={`${className} opacity-50 cursor-not-allowed`}
          >
            <X className="w-4 h-4 mr-2" />
            Seu Anúncio
          </Button>
      );
    }

    if (ad?.ad_type !== 'venda') {
      return (
          <Button
              disabled
              variant="outline"
              size={size}
              className={`${className} opacity-50 cursor-not-allowed`}
          >
            <X className="w-4 h-4 mr-2" />
            Não Vendível
          </Button>
      );
    }

    return null;
  }

  // Renderizar controles de quantidade se item está no carrinho
  if (inCart && currentQuantity > 0 && showQuantity) {
    return (
        <div className={`inline-flex items-center ${className}`}>
          <Button
              onClick={() => handleUpdateQuantity(currentQuantity - 1)}
              disabled={isProcessing || currentQuantity <= 0}
              variant="outline"
              size={size}
              className="rounded-r-none border-r-0"
          >
            <Minus className="w-4 h-4" />
          </Button>

          <div className="px-4 py-2 border border-gray-300 bg-white text-center min-w-[60px] flex items-center justify-center">
            <span className="font-semibold text-gray-800">{currentQuantity}</span>
          </div>

          <Button
              onClick={() => handleUpdateQuantity(currentQuantity + 1)}
              disabled={isProcessing || currentQuantity >= maxQuantity}
              variant="outline"
              size={size}
              className="rounded-l-none border-l-0"
          >
            <Plus className="w-4 h-4" />
          </Button>

          <Button
              onClick={handleRemoveFromCart}
              disabled={isProcessing}
              variant="danger"
              size={size}
              className="ml-2"
              title="Remover do carrinho"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
    );
  }

  // Mostrar que está no carrinho (sem controles de quantidade)
  if (inCart && currentQuantity > 0 && !showQuantity) {
    return (
        <Button
            onClick={handleRemoveFromCart}
            disabled={isProcessing}
            variant="success"
            size={size}
            className={className}
        >
          <Check className="w-4 h-4 mr-2" />
          No Carrinho ({currentQuantity})
        </Button>
    );
  }

  // Botão padrão para adicionar ao carrinho
  return (
      <Button
          onClick={handleAddToCart}
          disabled={isProcessing}
          variant={variant}
          size={size}
          className={className}
          loading={isProcessing}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Adicionar ao Carrinho
      </Button>
  );
};

export default AddToCartButton;