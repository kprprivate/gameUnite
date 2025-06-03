export const cartUtils = {
  // Adicionar item ao carrinho
  addToCart(ad, quantity = 1) {
    const cartItems = this.getCartItems();

    // Verificar se já existe no carrinho
    const existingItemIndex = cartItems.findIndex(item => item.ad_id === ad._id);

    if (existingItemIndex > -1) {
      // Atualizar quantidade
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      // Adicionar novo item
      const cartItem = {
        ad_id: ad._id,
        title: ad.title,
        price: ad.price,
        image_url: ad.image_url || ad.game?.image_url,
        game_name: ad.game?.name,
        platform: ad.platform,
        seller_id: ad.user_id,
        quantity: quantity
      };
      cartItems.push(cartItem);
    }

    this.saveCartItems(cartItems);
    this.notifyCartUpdate();

    return { success: true, message: 'Item adicionado ao carrinho' };
  },

  // Remover item do carrinho
  removeFromCart(adId) {
    const cartItems = this.getCartItems();
    const filteredItems = cartItems.filter(item => item.ad_id !== adId);

    this.saveCartItems(filteredItems);
    this.notifyCartUpdate();

    return { success: true, message: 'Item removido do carrinho' };
  },

  // Atualizar quantidade
  updateQuantity(adId, quantity) {
    if (quantity < 1) {
      return this.removeFromCart(adId);
    }

    const cartItems = this.getCartItems();
    const itemIndex = cartItems.findIndex(item => item.ad_id === adId);

    if (itemIndex > -1) {
      cartItems[itemIndex].quantity = quantity;
      this.saveCartItems(cartItems);
      this.notifyCartUpdate();
    }

    return { success: true, message: 'Quantidade atualizada' };
  },

  // Limpar carrinho
  clearCart() {
    localStorage.removeItem('cart');
    this.notifyCartUpdate();
    return { success: true, message: 'Carrinho limpo' };
  },

  // Obter itens do carrinho
  getCartItems() {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      return [];
    }
  },

  // Salvar itens no carrinho
  saveCartItems(items) {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  },

  // Notificar atualização do carrinho
  notifyCartUpdate() {
    window.dispatchEvent(new Event('cart-updated'));
  },

  // Obter total de itens
  getCartItemCount() {
    const items = this.getCartItems();
    return items.reduce((total, item) => total + item.quantity, 0);
  },

  // Obter total do carrinho
  getCartTotal() {
    const items = this.getCartItems();
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  // Verificar se item está no carrinho
  isInCart(adId) {
    const items = this.getCartItems();
    return items.some(item => item.ad_id === adId);
  },

  // Validar carrinho antes do checkout
  validateCart() {
    const items = this.getCartItems();

    if (items.length === 0) {
      return { valid: false, message: 'Carrinho vazio' };
    }

    // Verificar se todos os itens têm preço
    const invalidItems = items.filter(item => !item.price || item.price <= 0);
    if (invalidItems.length > 0) {
      return { valid: false, message: 'Alguns itens não possuem preço válido' };
    }

    // Verificar se todas as quantidades são válidas
    const invalidQuantities = items.filter(item => !item.quantity || item.quantity <= 0);
    if (invalidQuantities.length > 0) {
      return { valid: false, message: 'Algumas quantidades são inválidas' };
    }

    return { valid: true };
  }
};