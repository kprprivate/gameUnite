import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { toast } from 'react-toastify';
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
  onAddToCart
}) => {
  const [isInCart, setIsInCart] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsInCart(cartUtils.isInCart(ad._id));
  }, [ad._id]);

  const handleAddToCart = async () => {
    if (loading) return;

    // Verificar se é anúncio de venda
    if (ad.ad_type !== 'venda') {
      toast.error('Apenas anúncios de venda podem ser adicionados ao carrinho');
      return;
    }

    // Verificar se tem preço
    if (!ad.price || ad.price <= 0) {
      toast.error('Este anúncio não possui preço válido');
      return;
    }

    setLoading(true);

    try {
      const result = cartUtils.addToCart(ad, quantity);

      if (result.success) {
        setIsInCart(true);
        toast.success(result.message);

        if (onAddToCart) {
          onAddToCart(ad, quantity);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setLoading(false);
    }
  };

  if (isInCart) {
    return (
      <Button
        variant="outline"
        size={size}
        className={`border-green-500 text-green-600 ${className}`}
        disabled
      >
        {showIcon && <Check className="w-4 h-4 mr-2" />}
        No Carrinho
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
    >
      {showIcon && <ShoppingCart className="w-4 h-4 mr-2" />}
      Adicionar ao Carrinho
    </Button>
  );
};

export default AddToCartButton;