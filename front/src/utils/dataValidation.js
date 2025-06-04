// front/src/utils/dataValidation.js - Script de validação e limpeza
export const dataValidation = {
  // Validar se um ID é um ObjectId válido
  isValidObjectId(id) {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  // Limpar localStorage de dados inválidos
  cleanLocalStorage() {
    const results = {
      cleaned: [],
      errors: []
    };

    try {
      // Limpar carrinho
      const cartResult = this.cleanCart();
      if (cartResult.cleaned > 0) {
        results.cleaned.push(`Carrinho: ${cartResult.cleaned} itens inválidos removidos`);
      }

      // Limpar outros dados do localStorage se necessário
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        try {
          const value = localStorage.getItem(key);
          if (value && this.isJsonString(value)) {
            const data = JSON.parse(value);

            // Verificar se contém IDs inválidos
            if (this.containsInvalidIds(data)) {
              results.cleaned.push(`${key}: dados com IDs inválidos encontrados`);
              // Opcionalmente remover ou corrigir
              // localStorage.removeItem(key);
            }
          }
        } catch (error) {
          results.errors.push(`Erro ao verificar ${key}: ${error.message}`);
        }
      }

    } catch (error) {
      results.errors.push(`Erro geral: ${error.message}`);
    }

    return results;
  },

  // Limpar carrinho de itens inválidos
  cleanCart() {
    const result = {
      original: 0,
      cleaned: 0,
      remaining: 0
    };

    try {
      const cartData = localStorage.getItem('cart');
      if (!cartData) return result;

      const items = JSON.parse(cartData);
      if (!Array.isArray(items)) {
        localStorage.removeItem('cart');
        return { ...result, cleaned: 1 };
      }

      result.original = items.length;

      const validItems = items.filter(item => {
        return (
          item &&
          typeof item === 'object' &&
          this.isValidObjectId(item.ad_id) &&
          item.title &&
          typeof item.price === 'number' &&
          item.price > 0 &&
          typeof item.quantity === 'number' &&
          item.quantity > 0
        );
      });

      result.remaining = validItems.length;
      result.cleaned = result.original - result.remaining;

      if (result.cleaned > 0) {
        localStorage.setItem('cart', JSON.stringify(validItems));
        window.dispatchEvent(new Event('cart-updated'));
      }

    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      localStorage.removeItem('cart');
      result.cleaned = 1;
    }

    return result;
  },

  // Verificar se uma string é JSON válido
  isJsonString(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  },

  // Verificar se um objeto contém IDs inválidos
  containsInvalidIds(obj) {
    if (!obj || typeof obj !== 'object') return false;

    const checkObject = (item) => {
      if (Array.isArray(item)) {
        return item.some(checkObject);
      }

      if (typeof item === 'object' && item !== null) {
        for (const [key, value] of Object.entries(item)) {
          if (key.includes('_id') || key.includes('Id')) {
            if (typeof value === 'string' && !this.isValidObjectId(value)) {
              return true;
            }
          }
          if (checkObject(value)) {
            return true;
          }
        }
      }

      return false;
    };

    return checkObject(obj);
  },

  // Validar estrutura de anúncio
  validateAdStructure(ad) {
    const errors = [];

    if (!ad || typeof ad !== 'object') {
      errors.push('Anúncio deve ser um objeto');
      return { valid: false, errors };
    }

    // Verificar campos obrigatórios
    const requiredFields = {
      '_id': 'string',
      'title': 'string',
      'description': 'string',
      'ad_type': 'string',
      'price': 'number',
      'user_id': 'string'
    };

    for (const [field, type] of Object.entries(requiredFields)) {
      if (!(field in ad)) {
        errors.push(`Campo '${field}' é obrigatório`);
      } else if (typeof ad[field] !== type) {
        errors.push(`Campo '${field}' deve ser do tipo ${type}`);
      } else if (field.includes('_id') && !this.isValidObjectId(ad[field])) {
        errors.push(`Campo '${field}' deve ser um ObjectId válido`);
      }
    }

    // Validar tipo de anúncio
    if (ad.ad_type && !['venda', 'troca', 'procura'].includes(ad.ad_type)) {
      errors.push('Tipo de anúncio inválido');
    }

    // Validar preço para vendas
    if (ad.ad_type === 'venda' && (!ad.price || ad.price <= 0)) {
      errors.push('Preço deve ser positivo para vendas');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Relatório completo de validação
  generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      localStorage: {},
      recommendations: []
    };

    // Verificar localStorage
    report.localStorage = this.cleanLocalStorage();

    // Gerar recomendações
    if (report.localStorage.cleaned.length > 0) {
      report.recommendations.push('Dados inválidos foram encontrados e limpos do localStorage');
    }

    if (report.localStorage.errors.length > 0) {
      report.recommendations.push('Alguns erros foram encontrados durante a limpeza');
    }

    // Verificar se há dados do usuário válidos
    const userToken = document.cookie.includes('access_token');
    if (!userToken) {
      report.recommendations.push('Usuário não está logado - alguns recursos podem não funcionar');
    }

    return report;
  },

  // Executar limpeza automática
  autoClean() {
    console.log('🧹 Iniciando limpeza automática de dados...');

    const report = this.generateValidationReport();

    if (report.localStorage.cleaned.length > 0) {
      console.log('✅ Dados inválidos limpos:', report.localStorage.cleaned);
    }

    if (report.localStorage.errors.length > 0) {
      console.warn('⚠️  Erros encontrados:', report.localStorage.errors);
    }

    if (report.recommendations.length > 0) {
      console.log('💡 Recomendações:', report.recommendations);
    }

    console.log('🧹 Limpeza automática concluída');

    return report;
  },

  // Função para ser executada no carregamento da página
  initializeValidation() {
    // Executar limpeza automática
    const report = this.autoClean();

    // Configurar listener para mudanças no carrinho
    window.addEventListener('cart-updated', () => {
      this.cleanCart();
    });

    return report;
  }
};

// Auto-executar validação ao carregar o módulo
if (typeof window !== 'undefined') {
  // Executar após 1 segundo para garantir que tudo foi carregado
  setTimeout(() => {
    dataValidation.initializeValidation();
  }, 1000);
}