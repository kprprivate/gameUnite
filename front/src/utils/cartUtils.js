// front/src/utils/cartUtils.js - VERSÃO CORRIGIDA E MODULAR
export const cartUtils = {
  // Chave para localStorage
  STORAGE_KEY: 'cart',

  // Adicionar item ao carrinho
  addToCart(ad, quantity = 1) {
    try {
      // Validar dados do anúncio
      if (!ad || !ad._id) {
        return { success: false, message: 'Dados do anúncio inválidos' };
      }

      // Verificar se é anúncio de venda
      if (ad.ad_type !== 'venda') {
        return { success: false, message: 'Apenas anúncios de venda podem ser adicionados ao carrinho' };
      }

      // Verificar se tem preço válido
      if (!ad.price || ad.price <= 0) {
        return { success: false, message: 'Anúncio sem preço válido' };
      }

      const cartItems = this.getCartItems();

      // Verificar se já existe no carrinho
      const existingItemIndex = cartItems.findIndex(item => item.ad_id === ad._id);

      if (existingItemIndex > -1) {
        // Atualizar quantidade
        cartItems[existingItemIndex].quantity += quantity;
      } else {
        // Criar novo item do carrinho
        const cartItem = {
          ad_id: ad._id,
          title: ad.title,
          price: parseFloat(ad.price),
          image_url: ad.image_url || ad.game?.image_url || null,
          game_name: ad.game?.name || 'Jogo não informado',
          platform: ad.platform || 'Não informado',
          condition: ad.condition || 'Não informado',
          seller_id: ad.user_id || ad.user?._id,
          seller_name: ad.user?.username || 'Vendedor',
          quantity: quantity,
          added_at: new Date().toISOString()
        };
        cartItems.push(cartItem);
      }

      this.saveCartItems(cartItems);
      this.notifyCartUpdate();

      return {
        success: true,
        message: `${ad.title} adicionado ao carrinho`,
        itemCount: this.getCartItemCount()
      };
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      return { success: false, message: 'Erro interno ao adicionar ao carrinho' };
    }
  },

  // Remover item do carrinho
  removeFromCart(adId) {
    try {
      if (!adId) {
        return { success: false, message: 'ID do anúncio não fornecido' };
      }

      const cartItems = this.getCartItems();
      const filteredItems = cartItems.filter(item => item.ad_id !== adId);

      this.saveCartItems(filteredItems);
      this.notifyCartUpdate();

      return {
        success: true,
        message: 'Item removido do carrinho',
        itemCount: this.getCartItemCount()
      };
    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
      return { success: false, message: 'Erro interno ao remover do carrinho' };
    }
  },

  // Atualizar quantidade
  updateQuantity(adId, quantity) {
    try {
      if (!adId) {
        return { success: false, message: 'ID do anúncio não fornecido' };
      }

      if (quantity < 1) {
        return this.removeFromCart(adId);
      }

      const cartItems = this.getCartItems();
      const itemIndex = cartItems.findIndex(item => item.ad_id === adId);

      if (itemIndex > -1) {
        cartItems[itemIndex].quantity = parseInt(quantity);
        this.saveCartItems(cartItems);
        this.notifyCartUpdate();

        return {
          success: true,
          message: 'Quantidade atualizada',
          itemCount: this.getCartItemCount()
        };
      } else {
        return { success: false, message: 'Item não encontrado no carrinho' };
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      return { success: false, message: 'Erro interno ao atualizar quantidade' };
    }
  },

  // Limpar carrinho
  clearCart() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.notifyCartUpdate();
      return { success: true, message: 'Carrinho limpo' };
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      return { success: false, message: 'Erro ao limpar carrinho' };
    }
  },

  // Obter itens do carrinho
  getCartItems() {
    try {
      const savedCart = localStorage.getItem(this.STORAGE_KEY);
      if (!savedCart) return [];

      const items = JSON.parse(savedCart);

      // Validar itens e filtrar inválidos
      return items.filter(item =>
        item &&
        item.ad_id &&
        item.title &&
        item.price &&
        item.price > 0 &&
        item.quantity &&
        item.quantity > 0
      );
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      // Em caso de erro, limpar carrinho corrompido
      localStorage.removeItem(this.STORAGE_KEY);
      return [];
    }
  },

  // Salvar itens no carrinho
  saveCartItems(items) {
    try {
      if (!Array.isArray(items)) {
        throw new Error('Items deve ser um array');
      }

      // Filtrar e validar itens antes de salvar
      const validItems = items.filter(item =>
        item &&
        item.ad_id &&
        item.title &&
        item.price &&
        item.price > 0 &&
        item.quantity &&
        item.quantity > 0
      );

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validItems));
      return true;
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
      return false;
    }
  },

  // Notificar atualização do carrinho
  notifyCartUpdate() {
    try {
      // Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('cart-updated', {
        detail: {
          itemCount: this.getCartItemCount(),
          total: this.getCartTotal(),
          items: this.getCartItems()
        }
      }));

      // Também disparar evento storage para compatibilidade
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Erro ao notificar atualização do carrinho:', error);
    }
  },

  // Obter total de itens
  getCartItemCount() {
    try {
      const items = this.getCartItems();
      return items.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
    } catch (error) {
      console.error('Erro ao contar itens do carrinho:', error);
      return 0;
    }
  },

  // Obter total do carrinho
  getCartTotal() {
    try {
      const items = this.getCartItems();
      return items.reduce((total, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return total + (price * quantity);
      }, 0);
    } catch (error) {
      console.error('Erro ao calcular total do carrinho:', error);
      return 0;
    }
  },

  // Verificar se item está no carrinho
  isInCart(adId) {
    try {
      if (!adId) return false;

      const items = this.getCartItems();
      return items.some(item => item.ad_id === adId);
    } catch (error) {
      console.error('Erro ao verificar item no carrinho:', error);
      return false;
    }
  },

  // Obter item específico do carrinho
  getCartItem(adId) {
    try {
      if (!adId) return null;

      const items = this.getCartItems();
      return items.find(item => item.ad_id === adId) || null;
    } catch (error) {
      console.error('Erro ao buscar item do carrinho:', error);
      return null;
    }
  },

  // Validar carrinho antes do checkout
  validateCart() {
    try {
      const items = this.getCartItems();

      if (items.length === 0) {
        return { valid: false, message: 'Carrinho vazio' };
      }

      // Verificar se todos os itens têm preço válido
      const invalidPriceItems = items.filter(item => !item.price || item.price <= 0);
      if (invalidPriceItems.length > 0) {
        return {
          valid: false,
          message: `${invalidPriceItems.length} item(ns) sem preço válido`,
          invalidItems: invalidPriceItems
        };
      }

      // Verificar se todas as quantidades são válidas
      const invalidQuantityItems = items.filter(item => !item.quantity || item.quantity <= 0);
      if (invalidQuantityItems.length > 0) {
        return {
          valid: false,
          message: `${invalidQuantityItems.length} item(ns) com quantidade inválida`,
          invalidItems: invalidQuantityItems
        };
      }

      // Verificar se todos os vendedores são diferentes do comprador (se fornecido)
      const currentUserId = this.getCurrentUserId();
      if (currentUserId) {
        const ownItems = items.filter(item => item.seller_id === currentUserId);
        if (ownItems.length > 0) {
          return {
            valid: false,
            message: 'Você não pode comprar seus próprios anúncios',
            invalidItems: ownItems
          };
        }
      }

      return {
        valid: true,
        itemCount: items.length,
        total: this.getCartTotal()
      };
    } catch (error) {
      console.error('Erro ao validar carrinho:', error);
      return { valid: false, message: 'Erro ao validar carrinho' };
    }
  },

  // Obter ID do usuário atual (helper)
  getCurrentUserId() {
    try {
      // Tentar obter do contexto ou cookies
      // Isso pode variar dependendo de como você armazena o usuário
      const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData._id || userData.id;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  // Preparar dados para checkout
  prepareCheckoutData() {
    try {
      const validation = this.validateCart();
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      const items = this.getCartItems();
      const checkoutItems = items.map(item => ({
        ad_id: item.ad_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        notes: `Compra via carrinho - ${item.title}`
      }));

      return {
        success: true,
        data: {
          cart_items: checkoutItems,
          summary: {
            total_items: this.getCartItemCount(),
            total_amount: this.getCartTotal(),
            unique_sellers: [...new Set(items.map(item => item.seller_id))].length
          }
        }
      };
    } catch (error) {
      console.error('Erro ao preparar dados do checkout:', error);
      return { success: false, message: 'Erro ao preparar checkout' };
    }
  },

  // Limpar itens inválidos do carrinho
  cleanInvalidItems() {
    try {
      const items = this.getCartItems();
      const validItems = items.filter(item =>
        item &&
        item.ad_id &&
        item.title &&
        item.price &&
        item.price > 0 &&
        item.quantity &&
        item.quantity > 0
      );

      if (validItems.length !== items.length) {
        this.saveCartItems(validItems);
        this.notifyCartUpdate();
        return {
          success: true,
          message: `${items.length - validItems.length} item(ns) inválido(s) removido(s)`,
          removedCount: items.length - validItems.length
        };
      }

      return { success: true, message: 'Nenhum item inválido encontrado' };
    } catch (error) {
      console.error('Erro ao limpar itens inválidos:', error);
      return { success: false, message: 'Erro ao limpar itens inválidos' };
    }
  },

  // Estatísticas do carrinho
  getCartStats() {
    try {
      const items = this.getCartItems();

      return {
        totalItems: this.getCartItemCount(),
        uniqueItems: items.length,
        totalValue: this.getCartTotal(),
        averagePrice: items.length > 0 ? this.getCartTotal() / this.getCartItemCount() : 0,
        sellers: [...new Set(items.map(item => item.seller_id))],
        platforms: [...new Set(items.map(item => item.platform))],
        lastUpdated: Math.max(...items.map(item => new Date(item.added_at).getTime()))
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do carrinho:', error);
      return {
        totalItems: 0,
        uniqueItems: 0,
        totalValue: 0,
        averagePrice: 0,
        sellers: [],
        platforms: [],
        lastUpdated: 0
      };
    }
  }
};