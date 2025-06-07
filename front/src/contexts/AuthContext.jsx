import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lastAuthCheck, setLastAuthCheck] = useState(0);

  // Cache da verificação de autenticação (5 minutos)
  const AUTH_CACHE_DURATION = 5 * 60 * 1000;

  // Função para verificar se o usuário está autenticado
  const checkAuth = async (force = false) => {
    const now = Date.now();

    // OTIMIZAÇÃO: Usar cache se não for forçado e estiver dentro do tempo
    if (!force && (now - lastAuthCheck) < AUTH_CACHE_DURATION && user) {
      return;
    }

    const token = Cookies.get('access_token');

    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      setLastAuthCheck(now);
      return;
    }

    try {
      // Buscar dados do usuário usando o token
      const result = await userService.getProfile();

      if (result.success) {
        setUser(result.data.user);
        setIsAuthenticated(true);
        setLastAuthCheck(now);
      } else {
        // Token inválido, remover cookies
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
        setLastAuthCheck(now);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      // Em caso de erro, limpar dados
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
      setLastAuthCheck(now);
    }

    setLoading(false);
  };

  useEffect(() => {
    checkAuth();

    // OTIMIZAÇÃO: Reduzir listeners desnecessários
    const handleStorageChange = (e) => {
      if (e.key === 'access_token' || e.key === 'refresh_token') {
        checkAuth(true); // Forçar verificação apenas se tokens mudaram
      }
    };

    // OTIMIZAÇÃO: Verificar apenas quando a janela ganha foco E passou tempo suficiente
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const now = Date.now();
        if ((now - lastAuthCheck) > AUTH_CACHE_DURATION) {
          checkAuth();
        }
      }
    };

    // Adicionar listeners
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // OTIMIZAÇÃO: Verificar autenticação apenas a cada 10 minutos (não 5)
    const authCheckInterval = setInterval(() => {
      if (isAuthenticated) {
        checkAuth();
      }
    }, 10 * 60 * 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(authCheckInterval);
    };
  }, [lastAuthCheck, isAuthenticated]);

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        setLastAuthCheck(Date.now());

        // Disparar evento personalizado para notificar outras abas
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'auth_status',
          newValue: 'logged_in',
          url: window.location.href
        }));
      }

      return result;
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, message: 'Erro interno no login' };
    }
  };

  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      return result;
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, message: 'Erro interno no registro' };
    }
  };

  const logout = () => {
    // Limpar estado local
    setUser(null);
    setIsAuthenticated(false);
    setLastAuthCheck(0);

    // Remover cookies
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');

    // Disparar evento para outras abas
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'auth_status',
      newValue: 'logged_out',
      url: window.location.href
    }));

    // Redirecionar
    window.location.href = '/login';
  };

  // Função para atualizar dados do usuário após mudanças no perfil
  const updateUser = (updatedUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
    // Atualizar timestamp do cache
    setLastAuthCheck(Date.now());
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated,
    checkAuth: () => checkAuth(true) // Expor função para revalidação manual forçada
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};