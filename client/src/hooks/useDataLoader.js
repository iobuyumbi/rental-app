import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const useDataLoader = (apiFunction, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction();
      setData(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Data loading error:', err);
      setError(err);
      toast.error(`Failed to load data: ${err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, dependencies);

  const refetch = () => {
    loadData();
  };

  return {
    data,
    loading,
    error,
    refetch,
    setData
  };
};

export default useDataLoader;
