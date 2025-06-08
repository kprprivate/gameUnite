import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

// Dynamic base URL based on environment
const getApiBaseUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // In development, use localhost
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:5000/api';
  }
  
  // In production, try using relative URL with Vite proxy first
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // In development with Vite proxy
    return '/api';
  }
  
  // In production, construct URL from current location
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // For production, assume API is on port 5000 or same domain with /api path
  return `${protocol}//${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false, // Importante para CORS
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Função para limpar sessão de forma segura
const clearSession = () => {
  Cookies.remove('access_token');
  Cookies.remove('refresh_token');

  // Disparar evento para informar outras abas sobre logout
  try {
    localStorage.setItem('auth_event', JSON.stringify({
      type: 'logout',
      timestamp: Date.now()
    }));

    // Remover o evento imediatamente para não interferir
    setTimeout(() => {
      localStorage.removeItem('auth_event');
    }, 100);
  } catch (error) {
    console.warn('Erro ao comunicar logout para outras abas:', error);
  }
};

// Função para validar token no localStorage/cookies
const isTokenValid = () => {
  const token = Cookies.get('access_token');
  if (!token) return false;

  try {
    // Verificar se o token não está expirado (verificação básica)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;

    // Se o token expira em menos de 30 segundos, considerá-lo inválido
    return payload.exp > (now + 30);
  } catch (error) {
    return false;
  }
};

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');

    // Adicionar token se existir
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }


    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Se é erro 401 e não é uma tentativa de retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Se já está fazendo refresh, adicionar à fila
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
          return Promise.reject(error);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      // Marcar que está fazendo refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get('refresh_token');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Tentar fazer refresh do token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
          timeout: 5000, // Timeout menor para refresh
        });

        if (response.data.success) {
          const { access_token } = response.data.data;

          // Salvar novo token
          Cookies.set('access_token', access_token, { expires: 1 });

          // Processar fila de requisições que falharam
          processQueue(null, access_token);

          // Retry da requisição original
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        console.warn('Refresh token failed:', refreshError.message);

        // Limpar sessão e processar fila de erros
        processQueue(refreshError, null);
        clearSession();

        // Só redirecionar se não estamos já na página de login
        if (!window.location.pathname.includes('/login')) {
          // Usar timeout para evitar problemas de estado
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Para outros erros, mostrar toast apenas se não for um retry e não for erro de autenticação já tratado
    if (error.response?.status !== 401 && !originalRequest._retry) {
      const message = error.response?.data?.message || 'Erro interno do servidor';

      // Evitar toasts duplicados
      const errorKey = `${error.config?.url}-${error.response?.status}-${message}`;
      const lastErrorTime = window.lastErrorToast?.[errorKey] || 0;
      const now = Date.now();

      if (now - lastErrorTime > 3000) { // 3 segundos entre toasts iguais
        toast.error(message);

        if (!window.lastErrorToast) window.lastErrorToast = {};
        window.lastErrorToast[errorKey] = now;
      }
    }

    return Promise.reject(error);
  }
);

// Listener para eventos de storage (comunicação entre abas)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth_event' && e.newValue) {
      try {
        const event = JSON.parse(e.newValue);

        if (event.type === 'logout') {
          // Outra aba fez logout, limpar esta aba também
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');

          // Só redirecionar se não estamos já na página de login
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.warn('Erro ao processar evento de auth:', error);
      }
    }
  });
}

export default api;