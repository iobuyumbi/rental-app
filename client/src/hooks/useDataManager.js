import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for managing CRUD operations with common patterns
 * @param {Object} config - Configuration object
 * @param {Function} config.fetchFn - Function to fetch data
 * @param {Function} config.createFn - Function to create new items
 * @param {Function} config.updateFn - Function to update items
 * @param {Function} config.deleteFn - Function to delete items
 * @param {string} config.entityName - Name of the entity for toast messages
 * @param {Array} config.initialData - Initial data array
 * @param {boolean} config.autoLoad - Whether to load data on mount
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

  // Load data
  const loadData = useCallback(async (params = {}) => {
    if (!fetchFn) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn(params);
      
      // Handle different response formats
      const newData = result?.data || result || [];
      setData(Array.isArray(newData) ? newData : []);
    } catch (err) {
      const errorMessage = err.message || `Failed to load ${entityName}s`;
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(`Error loading ${entityName}s:`, err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, entityName]);

  // Create new item
  const createItem = useCallback(async (itemData) => {
    if (!createFn) return null;
    
    try {
      setSubmitting(true);
      const result = await createFn(itemData);
      const newItem = result?.data || result;
      
      setData(prevData => [...prevData, newItem]);
      toast.success(`${entityName} created successfully`);
      return newItem;
    } catch (err) {
      const errorMessage = err.message || `Failed to create ${entityName}`;
      toast.error(errorMessage);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [createFn, entityName]);

  // Update existing item
  const updateItem = useCallback(async (id, itemData) => {
    if (!updateFn) return null;
    
    try {
      setSubmitting(true);
      const result = await updateFn(id, itemData);
      const updatedItem = result?.data || result;
      
      setData(prevData => 
        prevData.map(item => 
          (item._id || item.id) === id ? updatedItem : item
        )
      );
      toast.success(`${entityName} updated successfully`);
      return updatedItem;
    } catch (err) {
      const errorMessage = err.message || `Failed to update ${entityName}`;
      toast.error(errorMessage);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [updateFn, entityName]);

  // Delete item
  const deleteItem = useCallback(async (id) => {
    if (!deleteFn) return;
    
    try {
      setSubmitting(true);
      await deleteFn(id);
      
      setData(prevData => 
        prevData.filter(item => (item._id || item.id) !== id)
      );
      toast.success(`${entityName} deleted successfully`);
    } catch (err) {
      const errorMessage = err.message || `Failed to delete ${entityName}`;
      toast.error(errorMessage);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [deleteFn, entityName]);

  // Refresh data
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Load data on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
  }, [autoLoad, loadData]);

  return {
    data,
    loading,
    error,
    submitting,
    loadData,
    createItem,
    updateItem,
    deleteItem,
    refresh,
    setData // Allow manual data updates if needed
  };
};

export { useDataManager };
export default useDataManager;
