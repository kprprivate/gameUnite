import { useState, useEffect } from 'react';

export const useApi = (apiFunction, dependencies = []) => {
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