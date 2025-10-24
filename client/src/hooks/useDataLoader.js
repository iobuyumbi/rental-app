import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for fetching and managing data state from an asynchronous API function.
 * * @param {Function} apiFunction - The asynchronous function to call to fetch data.
 * @param {Array<any>} dependencies - Dependencies array to trigger re-fetching (similar to useEffect).
 * @returns {Object} State and actions: { data, loading, error, refetch, setData }
 */
const useDataLoader = (apiFunction, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFunction();
      // Ensure data is always an array for component consumption
      setData(Array.isArray(response) ? response : (response ? [response] : []));
    } catch (err) {
      console.error('Data loading error:', err);
      setError(err);
      toast.error(`Failed to load data: ${err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and dependency tracking
  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // Memoize refetch function for stability
  const refetch = useCallback(() => {
    loadData();
  // We need to ensure that the refetch callback remains the same unless apiFunction changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFunction]);

  return {
    data,
    loading,
    error,
    refetch,
    setData
  };
};

export default useDataLoader;
