import React, { useState } from 'react';
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

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

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
        setCount(prev => newIsFavorited ? prev + 1 : prev - 1);

        if (onToggle) {
          onToggle(newIsFavorited, count);
        }

        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
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
        className={`p-2 rounded-full transition-colors ${
          isFavorited 
            ? 'bg-yellow-100 text-yellow-600' 
            : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-600'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart className={`${sizeClasses[size]} ${isFavorited ? 'fill-current' : ''}`} />
      </button>
      {showCount && (
        <span className="text-sm text-gray-600">{count}</span>
      )}
    </div>
  );
};

export default FavoriteButton;