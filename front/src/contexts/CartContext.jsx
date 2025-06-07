// front/src/contexts/CartContext.jsx - VERSÃO CORRIGIDA PARA is_in_cart
import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState({ items: [], total_items: 0, total_price: 0 });
  const [loading, setLoading] = useState(false);

  // Cache local para melhor performance
  const [cartCache, setCartCache] = useState(new Set());

  // Carregar carrinho quando usuário logar
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Usuário logado, carregando carrinho...');
      loadCart();
    } else {
      console.log('❌ Usuário não logado, limpando carrinho...');
      setCart({ items: [], total_items: 0, total_price: 0 });
      setCartCache(new Set());
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    if (!isAuthenticated) {
      console.log('⚠️ Tentativa de carregar carrinho sem autenticação');
      setCart({ items: [], total_items: 0, total_price: 0 });
      setCartCache(new Set());
      return;
    }

    setLoading(true);

    try {
      console.log('📡 Fazendo requisição para buscar carrinho...');

      const result = await cartService.getCart();

      console.log('📦 Resposta do carrinho (raw):', result);

      if (result.success) {
        const cartData = result.data || {};

        console.log('📋 Dados do carrinho extraídos:', cartData);

        // CORREÇÃO: Verificar diferentes estruturas possíveis
        let items = [];

        if (cartData.cart && Array.isArray(cartData.cart.items)) {
          items = cartData.cart.items;
          console.log('✅ Estrutura encontrada: data.cart.items');
        } else if (cartData.items && Array.isArray(cartData.items)) {
          items = cartData.items;
          console.log('✅ Estrutura encontrada: data.items');
        } else if (Array.isArray(cartData)) {
          items = cartData;
          console.log('✅ Estrutura encontrada: data como array');
        } else {
          console.log('⚠️ Estrutura não reconhecida, assumindo carrinho vazio');
          items = [];
        }

        console.log(`📊 Total de itens encontrados: ${items.length}`);

        // Garantir que cada item tem a estrutura correta
        const normalizedItems = items.map((item, index) => {
          console.log(`🔍 Processando item ${index + 1}:`, item);

          const normalizedItem = {
            _id: item._id || item.id || `temp_${index}`,
            ad_id: item.ad_id || item.adId,
            quantity: parseInt(item.quantity) || 1,
            price_snapshot: parseFloat(item.price_snapshot || item.price || 0),
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
            expires_at: item.expires_at,

            // Snapshot do anúncio normalizado
            ad_snapshot: {
              title: item.ad_snapshot?.title ||
                  item.title ||
                  item.ad?.title ||
                  'Item sem título',

              game_name: item.ad_snapshot?.game_name ||
                  item.game_name ||
                  item.ad?.game?.name ||
                  item.game?.name ||
                  'Jogo não identificado',

              platform: item.ad_snapshot?.platform ||
                  item.platform ||
                  item.ad?.platform ||
                  'Plataforma não informada',

              condition: item.ad_snapshot?.condition ||
                  item.condition ||
                  item.ad?.condition ||
                  'usado',

              image_url: item.ad_snapshot?.image_url ||
                  item.image_url ||
                  item.ad?.image_url ||
                  item.ad?.game?.image_url ||
                  null,

              seller_username: item.ad_snapshot?.seller_username ||
                  item.seller_username ||
                  item.ad?.user?.username ||
                  item.seller?.username ||
                  'Vendedor',

              seller_id: item.ad_snapshot?.seller_id ||
                  item.seller_id ||
                  item.ad?.user_id ||
                  item.ad?.user?._id,

              description: item.ad_snapshot?.description ||
                  item.description ||
                  item.ad?.description ||
                  ''
            }
          };

          console.log(`✅ Item ${index + 1} normalizado:`, normalizedItem);
          return normalizedItem;
        });

        // Calcular totais
        const total_items = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
        const total_price = normalizedItems.reduce((sum, item) => {
          return sum + (item.price_snapshot * item.quantity);
        }, 0);

        const normalizedCart = {
          items: normalizedItems,
          total_items,
          total_price
        };

        console.log('🎯 Carrinho final normalizado:', normalizedCart);
        setCart(normalizedCart);

        // CORREÇÃO: Atualizar cache local para is_in_cart
        const adIds = new Set(normalizedItems.map(item => item.ad_id));
        setCartCache(adIds);
        console.log('💾 Cache do carrinho atualizado:', Array.from(adIds));

        // Notificar outras partes do app
        window.dispatchEvent(new CustomEvent('cart-updated', {
          detail: normalizedCart
        }));
      } else {
        console.error('❌ Erro ao carregar carrinho:', result.message);
        setCart({ items: [], total_items: 0, total_price: 0 });
        setCartCache(new Set());

        // Só mostrar toast se não for erro de "carrinho vazio"
        if (!result.message?.toLowerCase().includes('vazio')) {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error('💥 Erro ao carregar carrinho:', error);
      setCart({ items: [], total_items: 0, total_price: 0 });
      setCartCache(new Set());
      toast.error('Erro ao carregar carrinho');
    }

    setLoading(false);
  };

  const addToCart = async (ad, quantity = 1) => {
    if (!isAuthenticated) {
      toast.info('Faça login para adicionar itens ao carrinho');
      return { success: false, message: 'Login necessário' };
    }

    console.log('➕ Adicionando ao carrinho:', { ad: ad._id, quantity });

    try {
      const result = await cartService.addToCart(ad._id, quantity);

      console.log('📥 Resposta de adicionar:', result);

      if (result.success) {
        // CORREÇÃO: Atualizar cache imediatamente
        setCartCache(prev => new Set([...prev, ad._id]));

        // Recarregar carrinho após adicionar
        await loadCart();
        toast.success(result.message || 'Item adicionado ao carrinho');
      } else {
        toast.error(result.message);
      }

      return result;
    } catch (error) {
      console.error('💥 Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho');
      return { success: false, message: 'Erro interno' };
    }
  };

  const updateCartItem = async (adId, quantity) => {
    console.log('🔄 Atualizando item do carrinho:', { adId, quantity });

    try {
      const result = await cartService.updateCartItem(adId, quantity);

      if (result.success) {
        // Se quantidade for 0, remover do cache
        if (quantity === 0) {
          setCartCache(prev => {
            const newCache = new Set(prev);
            newCache.delete(adId);
            return newCache;
          });
        }

        await loadCart(); // Recarregar carrinho
        toast.success(result.message || 'Quantidade atualizada');
      } else {
        toast.error(result.message);
      }

      return result;
    } catch (error) {
      console.error('💥 Erro ao atualizar item:', error);
      toast.error('Erro ao atualizar item');
      return { success: false, message: 'Erro interno' };
    }
  };

  const removeFromCart = async (adId) => {
    console.log('➖ Removendo do carrinho:', adId);

    try {
      const result = await cartService.removeFromCart(adId);

      if (result.success) {
        // CORREÇÃO: Atualizar cache imediatamente
        setCartCache(prev => {
          const newCache = new Set(prev);
          newCache.delete(adId);
          return newCache;
        });

        await loadCart(); // Recarregar carrinho
        toast.success(result.message || 'Item removido');
      } else {
        toast.error(result.message);
      }

      return result;
    } catch (error) {
      console.error('💥 Erro ao remover item:', error);
      toast.error('Erro ao remover item');
      return { success: false, message: 'Erro interno' };
    }
  };

  const clearCart = async () => {
    console.log('🧹 Limpando carrinho...');

    try {
      const result = await cartService.clearCart();

      if (result.success) {
        setCart({ items: [], total_items: 0, total_price: 0 });
        setCartCache(new Set());
        toast.success(result.message || 'Carrinho limpo');

        // Notificar atualização
        window.dispatchEvent(new CustomEvent('cart-updated', {
          detail: { items: [], total_items: 0, total_price: 0 }
        }));
      } else {
        toast.error(result.message);
      }

      return result;
    } catch (error) {
      console.error('💥 Erro ao limpar carrinho:', error);
      toast.error('Erro ao limpar carrinho');
      return { success: false, message: 'Erro interno' };
    }
  };

  const validateCart = async () => {
    console.log('🔍 Validando carrinho...');

    try {
      const result = await cartService.validateCart();

      if (result.success) {
        if (result.data?.total_invalid > 0) {
          toast.warning(`${result.data.total_invalid} item(s) removido(s) do carrinho (não disponível)`);
          await loadCart(); // Recarregar após limpeza
        }
      }

      return result;
    } catch (error) {
      console.error('💥 Erro ao validar carrinho:', error);
      return { success: false, message: 'Erro ao validar carrinho' };
    }
  };

  // CORREÇÃO: Usar cache para melhor performance
  const isInCart = (adId) => {
    if (!adId) return false;

    // Primeiro verificar cache local
    if (cartCache.has(adId)) {
      return true;
    }

    // Fallback: verificar no carrinho atual
    if (!cart.items || !Array.isArray(cart.items)) return false;
    const inCart = cart.items.some(item => item.ad_id === adId);

    // Atualizar cache se encontrado
    if (inCart) {
      setCartCache(prev => new Set([...prev, adId]));
    }

    return inCart;
  };

  const getCartItemQuantity = (adId) => {
    if (!cart.items || !Array.isArray(cart.items)) return 0;
    const item = cart.items.find(item => item.ad_id === adId);
    return item ? item.quantity : 0;
  };

  // Função para checkout
  const getCartForCheckout = () => {
    if (!cart.items || !Array.isArray(cart.items)) {
      return {
        items: [],
        total_items: 0,
        total_price: 0,
        sellers: []
      };
    }

    // Preparar dados especificamente para checkout
    const checkoutItems = cart.items.map(item => ({
      ad_id: item.ad_id,
      quantity: item.quantity,
      price: item.price_snapshot,
      title: item.ad_snapshot.title,
      game_name: item.ad_snapshot.game_name,
      seller_id: item.ad_snapshot.seller_id,
      seller_name: item.ad_snapshot.seller_username,
      image_url: item.ad_snapshot.image_url
    }));

    // Identificar vendedores únicos
    const uniqueSellers = [...new Set(checkoutItems.map(item => item.seller_id))].filter(Boolean);

    return {
      items: checkoutItems,
      total_items: cart.total_items,
      total_price: cart.total_price,
      sellers: uniqueSellers,
      seller_count: uniqueSellers.length
    };
  };

  // Debug: Log do estado atual do carrinho
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🛒 Estado atual do carrinho:', {
        items: cart.items?.length || 0,
        total_items: cart.total_items,
        total_price: cart.total_price,
        cache_size: cartCache.size,
        cache_items: Array.from(cartCache),
        loading,
        isAuthenticated
      });
    }
  }, [cart, cartCache, loading, isAuthenticated]);

  const value = {
    cart,
    loading,
    loadCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    validateCart,
    isInCart,
    getCartItemQuantity,
    getCartForCheckout
  };

  return (
      <CartContext.Provider value={value}>
        {children}
      </CartContext.Provider>
  );
};