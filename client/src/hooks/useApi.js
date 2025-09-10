import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import useOfflineData from './useOfflineData';

const useApi = (apiCall, options = {}) => {
  const { cacheKey, offlineDataKey, syncOnReconnect = true } = options;
  const [data, setData] = useState(options.initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchIndex, setRefetchIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Initialize offline data management if offlineDataKey is provided
  const {
    data: offlineData,
    isSyncing,
    syncWithServer,
    addItem: addOfflineItem,
    updateItem: updateOfflineItem,
    removeItem: removeOfflineItem,
  } = useOfflineData(offlineDataKey, options.initialData || []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncOnReconnect && offlineDataKey) {
        syncWithServer(apiCall).then(() => {
          // After successful sync, refetch fresh data
          if (options.immediate !== false) {
            execute();
          }
        });
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineDataKey, syncOnReconnect, apiCall, options.immediate, syncWithServer]);

  // Execute the API call with offline support
  const execute = useCallback(async (params, method = 'GET', payload = null) => {
    const operation = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For GET requests, try to get from cache first if offline
        if (method === 'GET' && !isOnline && cacheKey) {
          const cachedData = localStorage.getItem(`cache_${cacheKey}`);
          if (cachedData) {
            setData(JSON.parse(cachedData));
            return { data: JSON.parse(cachedData), fromCache: true };
          }
        }
        
        // Execute the API call
        const result = await apiCall(params, method, payload);
        
        // Cache the result for GET requests
        if (method === 'GET' && cacheKey) {
          localStorage.setItem(`cache_${cacheKey}`, JSON.stringify(result.data));
        }
        
        setData(result.data);
        return result;
        
      } catch (err) {
        // If offline and not a GET request, queue the operation
        if (!isOnline && method !== 'GET' && offlineDataKey) {
          const operationId = Date.now();
          const offlineOperation = {
            id: operationId,
            type: method.toLowerCase(),
            params,
            payload,
            timestamp: new Date().toISOString(),
          };
          
          if (method === 'POST' || method === 'PUT') {
            addOfflineItem(offlineOperation);
            toast.warning('Operation queued for sync when online');
            return { data: { ...payload, _offline: true, _id: `offline_${operationId}` } };
          } else if (method === 'DELETE') {
            // For deletes, we'll need to handle this carefully
            removeOfflineItem(params.id);
            toast.warning('Delete operation queued for sync when online');
            return { data: { _id: params.id, _deleted: true } };
          }
        }
        
        const errorMessage = err.response?.data?.message || 'An error occurred';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
        
      } finally {
        setLoading(false);
      }
    };

    return operation();
  }, [apiCall, isOnline, cacheKey, offlineDataKey, addOfflineItem, removeOfflineItem]);

  // Helper methods for different HTTP methods
  const get = useCallback((params) => execute(params, 'GET'), [execute]);
  const post = useCallback((params, payload) => execute(params, 'POST', payload), [execute]);
  const put = useCallback((id, params, payload) => execute({ ...params, id }, 'PUT', payload), [execute]);
  const del = useCallback((id, params = {}) => execute({ ...params, id }, 'DELETE'), [execute]);

  // Refetch function
  const refetch = useCallback(() => {
    setRefetchIndex(prevIndex => prevIndex + 1);
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (options.immediate !== false) {
      // If we have offline data, use it immediately while fetching fresh data
      if (offlineData?.length > 0) {
        setData(offlineData);
      }
      
      // Only fetch from network if online or if we don't have cached data
      if (isOnline || !cacheKey || !localStorage.getItem(`cache_${cacheKey}`)) {
        execute();
      } else if (cacheKey) {
        // Use cached data if available
        const cachedData = localStorage.getItem(`cache_${cacheKey}`);
        if (cachedData) {
          setData(JSON.parse(cachedData));
        }
      }
    }
  }, [refetchIndex, options.immediate, execute, isOnline, cacheKey, offlineData]);

  return { 
    data, 
    loading: loading || isSyncing, 
    error, 
    execute, 
    refetch,
    get,
    post,
    put,
    delete: del,
    isOnline,
    isSyncing,
    offlineData
  };
};

export default useApi;
