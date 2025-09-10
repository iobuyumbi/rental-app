import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const useOfflineData = (key, initialValue = []) => {
  const [data, setData] = useState(() => {
    try {
      const item = localStorage.getItem(`offline_${key}`);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Save data to localStorage and update state
  const setOfflineData = useCallback((newData) => {
    try {
      const dataToStore = typeof newData === 'function' ? newData(data) : newData;
      localStorage.setItem(`offline_${key}`, JSON.stringify(dataToStore));
      setData(dataToStore);
      return dataToStore;
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      toast.error('Failed to save data locally');
      throw error;
    }
  }, [key, data]);

  // Add an item to the offline data
  const addItem = useCallback((item) => {
    const newData = [...data, { ...item, _offline: true, _id: item._id || `offline_${Date.now()}` }];
    return setOfflineData(newData);
  }, [data, setOfflineData]);

  // Update an item in the offline data
  const updateItem = useCallback((id, updates) => {
    const newData = data.map(item => 
      item._id === id ? { ...item, ...updates, _offline: true } : item
    );
    return setOfflineData(newData);
  }, [data, setOfflineData]);

  // Remove an item from the offline data
  const removeItem = useCallback((id) => {
    const newData = data.filter(item => item._id !== id);
    return setOfflineData(newData);
  }, [data, setOfflineData]);

  // Clear all offline data
  const clearData = useCallback(() => {
    localStorage.removeItem(`offline_${key}`);
    setData(initialValue);
  }, [key, initialValue]);

  // Sync data with the server when online
  const syncWithServer = useCallback(async (syncFunction) => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const offlineData = [...data];
      const results = [];
      let hasError = false;

      for (const item of offlineData) {
        try {
          if (item._offline) {
            const { _offline, ...itemToSync } = item;
            const result = await syncFunction(itemToSync);
            results.push(result);
            
            // Remove synced item from local storage
            removeItem(item._id);
          }
        } catch (error) {
          console.error('Error syncing item:', error);
          hasError = true;
        }
      }

      if (hasError) {
        toast.warning('Some items failed to sync. They will be retried later.');
      } else if (results.length > 0) {
        toast.success('Offline changes synced successfully');
      }

      return results;
    } catch (error) {
      console.error('Error during sync:', error);
      toast.error('Failed to sync offline changes');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [data, isOnline, isSyncing, removeItem]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Notify service worker to sync data
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ 
          type: 'SYNC_DATA',
          key
        });
      }
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [key]);

  // Listen for sync messages from service worker
  useEffect(() => {
    const handleSyncMessage = (event) => {
      if (event.data && event.data.type === 'SYNC_DATA' && event.data.key === key) {
        // Trigger a sync if we have offline data
        if (data.length > 0) {
          // The actual sync function should be provided by the component
          // that uses this hook
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleSyncMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleSyncMessage);
    };
  }, [key, data]);

  return {
    data,
    isOnline,
    isSyncing,
    setData: setOfflineData,
    addItem,
    updateItem,
    removeItem,
    clearData,
    syncWithServer
  };
};

export default useOfflineData;
