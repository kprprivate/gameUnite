export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  RESET_REQUEST: '/auth/password/reset-request',
  RESET_PASSWORD: '/auth/password/reset',
  
  // Games
  GAMES: '/games',
  GAME_DETAILS: (id) => `/games/${id}`,
  FEATURED_GAMES: '/games/featured',
  
  // Ads
  ADS: '/ads',
  AD_DETAILS: (id) => `/ads/${id}`,
  BOOSTED_ADS: '/ads/boosted',
  
  // Users
  PROFILE: '/users/profile',
  
  // Health
  HEALTH: '/health'
};

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data'
};

export const AD_TYPES = {
  SALE: 'venda',
  TRADE: 'troca',
  WANTED: 'procura'
};

export const PLATFORMS = [
  { value: 'PC', label: 'PC' },
  { value: 'PlayStation 5', label: 'PlayStation 5' },
  { value: 'PlayStation 4', label: 'PlayStation 4' },
  { value: 'Xbox Series X/S', label: 'Xbox Series X/S' },
  { value: 'Xbox One', label: 'Xbox One' },
  { value: 'Nintendo Switch', label: 'Nintendo Switch' }
];

export const GAME_CONDITIONS = [
  { value: 'novo', label: 'Novo (lacrado)' },
  { value: 'seminovo', label: 'Seminovo (excelente estado)' },
  { value: 'usado', label: 'Usado (bom estado)' },
  { value: 'regular', label: 'Regular (com sinais de uso)' }
];

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  DEFAULT_SKIP: 0
};