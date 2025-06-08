// Dynamic base URL based on environment
const getBaseUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_UPLOAD_URL) {
    return import.meta.env.VITE_API_UPLOAD_URL;
  }
  
  // In development, use localhost
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5000/api/upload';
  }
  
  // In production, try using the Vite proxy first
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // In development with Vite proxy
    return '/api/upload';
  }
  
  // In production, construct URL from current location
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // For production, assume API is on port 5000 or same domain with /api path
  return `${protocol}//${hostname}:5000/api/upload`;
};

const BASE_URL = getBaseUrl();

export const imageUtils = {
  // URLs padrão para fallback
  defaults: {
    user: `${BASE_URL}/profiles/medium/no-user-image.jpg`,
    ad: `${BASE_URL}/ads/medium/no-ads-image.jpg`,
    game: `${BASE_URL}/games/medium/valorant.jpg`
  },

  // Gerar URL de imagem com fallback automático
  getImageUrl(imagePath, type = 'ad', size = 'medium') {
    // Se não tem imagem, usar padrão
    if (!imagePath || imagePath === '' || imagePath === null) {
      return this.defaults[type];
    }

    // Se já é uma URL completa e correta, retornar como está
    if (imagePath.startsWith(`${BASE_URL}/`)) {
      return imagePath;
    }

    // Se é uma URL completa mas antiga (uploads), corrigir
    if (imagePath.startsWith('http://127.0.0.1:5000/api/uploads/')) {
      return imagePath.replace('/api/uploads/', '/api/upload/');
    }

    // Se é URL externa (https://example.com), usar padrão local
    if (imagePath.startsWith('http')) {
      return this.defaults[type];
    }

    // Se é um nome de arquivo, construir URL completa
    return `${BASE_URL}/${type}/${size}/${imagePath}`;
  },

  // Gerar srcSet para imagens responsivas
  getSrcSet(imagePath, type = 'ad') {
    const baseUrl = this.getImageUrl(imagePath, type, 'medium');
    const basePath = baseUrl.replace('/medium/', '/');
    const filename = this.getFilename(baseUrl);

    return [
      `${basePath}thumbnail/${filename} 300w`,
      `${basePath}medium/${filename} 800w`,
      `${basePath}large/${filename} 1200w`
    ].join(', ');
  },

  // Extrair nome do arquivo da URL
  getFilename(url) {
    return url.split('/').pop();
  },

  // Verificar se imagem existe (para componentes)
  async checkImageExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  },

  // Validar arquivo antes do upload
  validateImageFile(file, maxSizeMB = 10) {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Tipo de arquivo não suportado. Use PNG, JPG, GIF ou WebP.' };
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return { valid: false, error: `Arquivo muito grande. Máximo ${maxSizeMB}MB.` };
    }

    return { valid: true };
  },

  // Redimensionar imagem no client-side antes do upload
  async resizeImageFile(file, maxWidth = 1200, maxHeight = 900, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Redimensionar
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
};

export default imageUtils;