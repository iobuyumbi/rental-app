import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { calculateChargeableDays } from '../utils/dateUtils';
import { workerTasksAPI } from '../api/workerTasksAPI';

/**
 * Custom hook that encapsulates all business logic for OrdersPage
 * Separates business logic from UI state management
 */
export const useOrdersBusinessLogic = ({
  orders,
  orderForm,
  orderItems,
  setOrderItems,
  setProductSearch,
  setSelectedProduct,
  setQuantity,
  loadOrders,
  createWorkerTaskFn,
  updateWorkerTaskFn,
  updateOrder,
  createOrder,
  user,
}) => {
  // Calculate order totals - simplified for frontend display
  // NOTE: This should eventually be moved to backend business logic
  const totals = useMemo(() => {
    // For now, use 1 day as default chargeable days for new orders
    const defaultChargeableDays = 1;
    
    const subtotal = orderItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      // Use explicit daysUsed if set, otherwise default to 1 day
      const itemDays = item.daysUsed || defaultChargeableDays;
      return sum + quantity * unitPrice * itemDays;
    }, 0);
    
    const discountAmount = (subtotal * (parseFloat(orderForm.values.discount) || 0)) / 100;
    const taxAmount = ((subtotal - discountAmount) * (parseFloat(orderForm.values.taxRate) || 16)) / 100;
    const totalAmount = subtotal - discountAmount + taxAmount;
    
    return {
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      chargeableDays: defaultChargeableDays
    };
  }, [orderItems, orderForm.values.startDate, orderForm.values.endDate, orderForm.values.discount, orderForm.values.taxRate]);

  // Product management functions
  const addItemToOrder = useCallback((selectedProduct, quantity) => {
    if (!selectedProduct || !quantity) return;

    const existingItemIndex = orderItems.findIndex(
      (item) => item.productId === selectedProduct._id
    );

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += parseInt(quantity);
      setOrderItems(updatedItems);
    } else {
      // Add new item
      const newItem = {
        productId: selectedProduct._id,
        productName: selectedProduct.name,
        quantity: parseInt(quantity),
        unitPrice: selectedProduct.rentalPrice,
        daysUsed: 1, // Default to 1 day for new items
      };
      setOrderItems([...orderItems, newItem]);
    }

    // Reset selection
    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
  }, [orderItems, setOrderItems, setSelectedProduct, setProductSearch, setQuantity, orderForm.values.defaultChargeableDays]);

  const updateItemQuantity = useCallback((index, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedItems = [...orderItems];
    updatedItems[index].quantity = newQuantity;
    setOrderItems(updatedItems);
  }, [orderItems, setOrderItems]);

  const updateItemUnitPrice = useCallback((index, newPrice) => {
    const updatedItems = [...orderItems];
    updatedItems[index].unitPrice = newPrice;
    updatedItems[index].priceModifiedBy = user?.name || 'Unknown User';
    updatedItems[index].priceModifiedAt = new Date().toISOString();
    setOrderItems(updatedItems);
  }, [orderItems, setOrderItems, user]);

  const updateItemDaysUsed = useCallback((index, newDays) => {
    if (newDays < 1) return;

    const updatedItems = [...orderItems];
    updatedItems[index].daysUsed = newDays;
    setOrderItems(updatedItems);
  }, [orderItems, setOrderItems]);

  const removeItem = useCallback((index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  }, [orderItems, setOrderItems]);

  // Worker task handlers
  const handleSubmitWorkerTask = useCallback(async (taskData) => {
    try {
      const editingTask = arguments[1]; // Pass editingTask as second argument
      if (editingTask) {
        await updateWorkerTaskFn(editingTask._id, taskData);
      } else {
        await createWorkerTaskFn(taskData);
      }
      // Refresh orders
      await loadOrders();
      return true;
    } catch (error) {
      console.error('Error saving worker task:', error);
      throw error;
    }
  }, [updateWorkerTaskFn, createWorkerTaskFn, loadOrders]);

  // Task management handlers
  const handleWorkflowTaskCreated = useCallback(async (taskData) => {
    try {
      await createWorkerTaskFn(taskData);
      toast.success('Worker task recorded successfully');
      await loadOrders();
    } catch (error) {
      console.error('Error creating workflow task:', error);
      throw error;
    }
  }, [createWorkerTaskFn, loadOrders]);

  const handleDeleteTaskFromHistory = useCallback(async (taskId) => {
    try {
      await workerTasksAPI.tasks.delete(taskId);
      toast.success('Worker task deleted successfully');
      await loadOrders();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete worker task');
      throw error;
    }
  }, [loadOrders]);

  // Status change handlers
  const handleStatusModalChange = useCallback(async (orderId, statusData) => {
    try {
      console.log('Changing order status:', orderId, statusData);

      const order = orders.find((o) => o._id === orderId);
      if (!order) throw new Error('Order not found');

      // Store previous status for workflow
      const previousStatus = order.status;

      // Update order status
      await updateOrder(orderId, statusData);

      // Refresh orders data
      await loadOrders();

      // Show success message with financial impact
      if (statusData.calculations?.difference) {
        const diff = statusData.calculations.difference;
        if (diff > 0) {
          toast.success(
            `Status updated. Additional charge: KES ${diff.toLocaleString()}`
          );
        } else if (diff < 0) {
          toast.success(
            `Status updated. Refund: KES ${Math.abs(diff).toLocaleString()}`
          );
        }
      } else {
        toast.success('Order status updated successfully');
      }

      return { order, previousStatus, newStatus: statusData.status };
    } catch (error) {
      console.error('Error changing order status:', error);
      toast.error(error.message || 'Failed to change order status');
      throw error;
    }
  }, [orders, updateOrder, loadOrders]);

  const handleWorkflowOrderUpdate = useCallback(async (orderId, updateData) => {
    try {
      await updateOrder(orderId, updateData);
      await loadOrders();
      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Error updating order from workflow:', error);
      toast.error('Failed to update order');
    }
  }, [updateOrder, loadOrders]);

  return {
    // Calculated values
    totals,

    // Product management
    addItemToOrder,
    updateItemQuantity,
    updateItemUnitPrice,
    updateItemDaysUsed,
    removeItem,

    // Worker task management
    handleSubmitWorkerTask,
    handleWorkflowTaskCreated,
    handleDeleteTaskFromHistory,

    // Status change management
    handleStatusModalChange,
    handleWorkflowOrderUpdate,
  };
};
