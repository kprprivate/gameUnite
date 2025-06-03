// front/src/contexts/AuthContext.jsx - VERSÃO CORRIGIDA
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

  // Função para verificar se o usuário está autenticado
  const checkAuth = async () => {
    const token = Cookies.get('access_token');

    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      // Buscar dados do usuário usando o token
      const result = await userService.getProfile();

      if (result.success) {
        setUser(result.data.user);
        setIsAuthenticated(true);
      } else {
        // Token inválido, remover cookies
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      // Em caso de erro, limpar dados
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    checkAuth();

    // Listener para mudanças nos cookies (importante para detectar login/logout em outras abas)
    const handleStorageChange = (e) => {
      if (e.key === 'access_token' || e.key === 'refresh_token') {
        checkAuth();
      }
    };

    // Listener para mudanças de foco na janela (detecta mudanças em outras abas)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };

    // Adicionar listeners
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Verificar autenticação a cada 5 minutos
    const authCheckInterval = setInterval(checkAuth, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(authCheckInterval);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);

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
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated,
    checkAuth // Expor função para revalidação manual se necessário
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};