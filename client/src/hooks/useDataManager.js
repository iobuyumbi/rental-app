import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for managing CRUD operations for a specific entity with common patterns.
 * This hook handles loading, submitting state, and user feedback via toasts.
 * * @param {Object} config - Configuration object
 * @param {Function} config.fetchFn - Function to fetch data (READ)
 * @param {Function} config.createFn - Function to create new items (CREATE)
 * @param {Function} config.updateFn - Function to update items (UPDATE)
 * @param {Function} config.deleteFn - Function to delete items (DELETE)
 * @param {string} [config.entityName='item'] - Name of the entity for toast messages (e.g., 'User', 'Product')
 * @param {Array} [config.initialData=[]] - Initial data array
 * @param {boolean} [config.autoLoad=true] - Whether to load data on mount
 * @returns {Object} State and CRUD actions
 */
const useDataManager = ({
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  entityName = 'item',
  initialData = [],
  autoLoad = true
}) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Request deduplication
  const requestInProgress = useRef(false);

  // Helper to find the correct item ID (supports both _id and id)
  const getItemId = (item) => item._id || item.id;

  // --- READ Operations ---

  // Load data function with rate limiting and deduplication
  const loadData = useCallback(async (params = {}) => {
    // Prevent multiple simultaneous requests
    if (requestInProgress.current) {
      console.warn(`Request already in progress for ${entityName}s`);
      return;
    }
    
    try {
      requestInProgress.current = true;
      setLoading(true);
      setError(null);
      const result = await fetchFn(params);
      
      // Handle different response formats (data field or direct array)
      const newData = result?.data || result || [];
      setData(Array.isArray(newData) ? newData : []);
    } catch (err) {
      // Handle rate limiting errors specifically
      if (err.response?.status === 429) {
        const errorMessage = 'Too many requests. Please wait a moment before trying again.';
        setError(errorMessage);
        toast.error(errorMessage);
        console.warn(`Rate limited for ${entityName}s:`, err);
        
        // Prevent retries for rate limiting
        return;
      }
      
      const errorMessage = err.message || `Failed to load ${entityName}s.`;
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(`Error loading ${entityName}s:`, err);
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  }, [fetchFn, entityName]);

  // Refresh/Refetch data
  const refetch = useCallback(() => {
    loadData();
  }, [loadData]);

  // Load data on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]); // loadData is in dependency array due to useCallback

  // --- CREATE Operation ---
  
  const createItem = useCallback(async (itemData) => {
    if (!createFn) {
      console.warn(`Attempted to call createItem but no createFn provided for ${entityName}.`);
      return null;
    }
    
    try {
      setSubmitting(true);
      const result = await createFn(itemData);
      const newItem = result?.data || result;
      
      // State update: Append new item
      setData(prevData => [...prevData, newItem]);
      toast.success(`${entityName} created successfully.`);
      return newItem;
    } catch (err) {
      const errorMessage = err.message || `Failed to create ${entityName}.`;
      toast.error(errorMessage);
      throw new Error(errorMessage); // Re-throw for component-level error handling
    } finally {
      setSubmitting(false);
    }
  }, [createFn, entityName]);

  // --- UPDATE Operation ---

  const updateItem = useCallback(async (id, itemData) => {
    if (!updateFn) {
      console.warn(`Attempted to call updateItem but no updateFn provided for ${entityName}.`);
      return null;
    }
    
    try {
      setSubmitting(true);
      const result = await updateFn(id, itemData);
      const updatedItem = result?.data || result;

      // State update: Replace the old item with the updated one
      setData(prevData => 
        prevData.map(item => 
          getItemId(item) === id ? updatedItem : item
        )
      );
      toast.success(`${entityName} updated successfully.`);
      return updatedItem;
    } catch (err) {
      const errorMessage = err.message || `Failed to update ${entityName}.`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [updateFn, entityName]);

  // --- DELETE Operation ---

  const deleteItem = useCallback(async (id) => {
    if (!deleteFn) {
      console.warn(`Attempted to call deleteItem but no deleteFn provided for ${entityName}.`);
      return;
    }
    
    try {
      setSubmitting(true);
      await deleteFn(id);
      
      // State update: Filter out the deleted item
      setData(prevData => 
        prevData.filter(item => getItemId(item) !== id)
      );
      toast.success(`${entityName} deleted successfully.`);
    } catch (err) {
      const errorMessage = err.message || `Failed to delete ${entityName}.`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [deleteFn, entityName]);


  return {
    // State
    data,
    loading,
    error,
    submitting,
    
    // Actions
    loadData,
    createItem,
    updateItem,
    deleteItem,
    refetch,
    setData, // Allow manual data updates if needed
    
    // Config
    entityName,
  };
};

export { useDataManager };
export default useDataManager;
