// front/src/components/Common/FavoriteButton.jsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { favoritesService } from '../../services/favoritesService';
import { useAuth } from '../../contexts/AuthContext';

const FavoriteButton = ({
  adId,
  initialIsFavorited = false,
  initialCount = 0,
  onToggle,
  size = 'md',
  showCount = true,
  className = ''
}) => {
  const { isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Verificar estado inicial do favorito quando o usuário está logado
  useEffect(() => {
    const checkInitialState = async () => {
      if (isAuthenticated && !hasChecked) {
        try {
          const result = await favoritesService.checkIsFavorite(adId);
          if (result.success) {
            setIsFavorited(result.data.is_favorited);
            setHasChecked(true);
          }
        } catch (error) {
          console.warn('Erro ao verificar estado inicial do favorito:', error);
          setHasChecked(true);
        }
      } else if (!isAuthenticated) {
        setIsFavorited(false);
        setHasChecked(true);
      }
    };

    checkInitialState();
  }, [adId, isAuthenticated, hasChecked]);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Faça login para favoritar anúncios');
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const result = await favoritesService.toggleFavorite(adId);
      if (result.success) {
        const newIsFavorited = result.data.is_favorited;
        setIsFavorited(newIsFavorited);

        // Atualizar contador baseado na ação
        if (result.data.action === 'added') {
          setCount(prev => prev + 1);
        } else if (result.data.action === 'removed') {
          setCount(prev => Math.max(0, prev - 1));
        }

        if (onToggle) {
          onToggle(newIsFavorited, count);
        }

        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      toast.error('Erro ao favoritar anúncio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`p-2 rounded-full transition-colors duration-200 ${
          isFavorited 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart className={`${sizeClasses[size]} transition-all duration-200 ${
          isFavorited ? 'fill-current text-red-600' : 'text-gray-600'
        }`} />
      </button>
      {showCount && (
        <span className="text-sm text-gray-600 font-medium">{count}</span>
      )}
    </div>
  );
};

export default FavoriteButton;