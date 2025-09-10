import { useState, useEffect, useCallback } from 'react';

const useApi = (apiCall, initialData = null, immediate = true) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const execute = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(params);
      setData(result.data);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const refetch = useCallback(() => {
    setRefetchIndex(prevIndex => prevIndex + 1);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate, refetchIndex]);

  return { data, loading, error, execute, refetch };
};

export default useApi;
