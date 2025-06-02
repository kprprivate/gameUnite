import React, { createContext, useContext, useState, useEffect } from 'react';
import { gameService } from '../services/gameService';

const GameContext = createContext();

// Mover o hook para fora resolve o warning
export const useGames = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGames deve ser usado dentro de um GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const [featuredGames, setFeaturedGames] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGames = async (params = {}) => {
    setLoading(true);
    const result = await gameService.getGames(params);
    if (result.success) {
      setGames(result.data.games);
    }
    setLoading(false);
    return result;
  };

  const fetchFeaturedGames = async () => {
    const result = await gameService.getFeaturedGames();
    if (result.success) {
      setFeaturedGames(result.data.featured_games);
    }
    return result;
  };

  useEffect(() => {
    fetchGames();
    fetchFeaturedGames();
  }, []);

  const value = {
    games,
    featuredGames,
    loading,
    fetchGames,
    fetchFeaturedGames
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// Exportar o contexto por último
export default GameContext;