import { useState, useEffect } from 'react';
import api from '../services/api';

// Hook for data fetching with API function
export const useApiData = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction();
        
        if (!isCancelled) {
          if (result.success) {
            setData(result.data);
          } else {
            setError(result.message || 'Erro ao carregar dados');
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Erro inesperado');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, dependencies);

  const refetch = () => {
    setLoading(true);
    setError(null);
    // Re-trigger the effect
  };

  return { data, loading, error, refetch };
};

// Hook that returns API client for making requests
export const useApi = () => {
  return {
    get: async (url, config = {}) => {
      try {
        const response = await api.get(url, config);
        return response.data;
      } catch (error) {
        console.error('API GET Error:', error.response?.data || error.message);
        throw error;
      }
    },
    post: async (url, data = {}, config = {}) => {
      try {
        const response = await api.post(url, data, config);
        return response.data;
      } catch (error) {
        console.error('API POST Error:', error.response?.data || error.message);
        throw error;
      }
    },
    put: async (url, data = {}, config = {}) => {
      try {
        const response = await api.put(url, data, config);
        return response.data;
      } catch (error) {
        console.error('API PUT Error:', error.response?.data || error.message);
        throw error;
      }
    },
    delete: async (url, config = {}) => {
      try {
        const response = await api.delete(url, config);
        return response.data;
      } catch (error) {
        console.error('API DELETE Error:', error.response?.data || error.message);
        throw error;
      }
    }
  };
};