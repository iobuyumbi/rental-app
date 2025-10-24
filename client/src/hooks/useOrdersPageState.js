import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ordersAPI, inventoryAPI, workersAPI } from '../services/api';
import { workerTasksAPI } from '../api/workerTasksAPI';
import { createWorkerTask, updateWorkerTask } from '../features/orders/tasks';
import useDataManager from './useDataManager';
import useFormManager from './useFormManager';

/**
 * Custom hook to manage all OrdersPage state and business logic
 * Extracts complex state management from the main component
 */
export const useOrdersPageState = () => {
  // Supporting data
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [workers, setWorkers] = useState([]);

  // Modal states
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Worker task states
  const [showWorkerTaskModal, setShowWorkerTaskModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [taskHistoryRefresh, setTaskHistoryRefresh] = useState(0);

  // Status change states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChangeOrder, setStatusChangeOrder] = useState(null);
  const [workflowContext, setWorkflowContext] = useState(null);

  // Daily task states
  const [showDailyTaskModal, setShowDailyTaskModal] = useState(false);

  // Product selection states
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState([]);

  // API functions
  const fetchOrders = useCallback(() => ordersAPI.getOrders({}), []);
  const createOrderFn = useCallback((data) => ordersAPI.createOrder(data), []);
  const updateOrderFn = useCallback((id, data) => ordersAPI.updateOrder(id, data), []);
  const deleteOrderFn = useCallback((id) => ordersAPI.deleteOrder(id), []);

  // Worker task API functions
  const createWorkerTaskFn = useCallback((data) => createWorkerTask(data), []);
  const updateWorkerTaskFn = useCallback((id, data) => updateWorkerTask(id, data), []);

  // Data management for orders
  const {
    data: orders,
    loading,
    error,
    createItem: createOrder,
    updateItem: updateOrder,
    deleteItem: deleteOrder,
    refetch: loadOrders,
  } = useDataManager({
    fetchFn: fetchOrders,
    createFn: createOrderFn,
    updateFn: updateOrderFn,
    deleteFn: deleteOrderFn,
    entityName: 'order',
  });

  // Form management for order creation/editing
  const orderForm = useFormManager(
    {
      client: '',
      items: [],
      startDate: '',
      endDate: '',
      status: 'pending',
      notes: '',
      paymentStatus: 'pending',
      deposit: 0,
      discount: 0,
      taxRate: 16,
      location: '',
      orderCompany: '',
    },
    {
      client: { required: true },
      startDate: { required: true },
      endDate: { required: true },
    }
  );

  // Load supporting data on mount
  useEffect(() => {
    loadSupportingData();
    loadWorkers();
  }, []);

  const loadSupportingData = async () => {
    try {
      const [clientsRes, productsRes] = await Promise.all([
        ordersAPI.getClients(),
        inventoryAPI.products.get(),
      ]);

      const clientsData = clientsRes?.data || clientsRes || [];
      const productsData = productsRes?.data || productsRes || [];

      setClients(Array.isArray(clientsData) ? clientsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error loading supporting data:', error);
      toast.error('Failed to load supporting data');
      setClients([]);
      setProducts([]);
    }
  };

  const loadWorkers = async () => {
    try {
      const response = await workersAPI.workers.get();
      const workersData = response?.data || response || [];
      setWorkers(Array.isArray(workersData) ? workersData : []);
    } catch (error) {
      console.error('Error loading workers:', error);
      toast.error('Failed to load workers data');
      setWorkers([]);
    }
  };

  // Return all state and handlers
  return {
    // Data
    orders,
    loading,
    error,
    clients,
    products,
    workers,

    // Modal states
    showAddOrder,
    setShowAddOrder,
    editingOrder,
    setEditingOrder,
    viewingOrder,
    setViewingOrder,
    showViewModal,
    setShowViewModal,

    // Worker task states
    showWorkerTaskModal,
    setShowWorkerTaskModal,
    selectedOrder,
    setSelectedOrder,
    editingTask,
    setEditingTask,
    taskHistoryRefresh,
    setTaskHistoryRefresh,

    // Status change states
    showStatusModal,
    setShowStatusModal,
    statusChangeOrder,
    setStatusChangeOrder,
    workflowContext,
    setWorkflowContext,

    // Daily task states
    showDailyTaskModal,
    setShowDailyTaskModal,

    // Product selection states
    productSearch,
    setProductSearch,
    selectedProduct,
    setSelectedProduct,
    quantity,
    setQuantity,
    orderItems,
    setOrderItems,

    // Form management
    orderForm,

    // API functions
    createOrder,
    updateOrder,
    deleteOrder,
    loadOrders,
    createWorkerTaskFn,
    updateWorkerTaskFn,

    // Utility functions
    loadSupportingData,
    loadWorkers,
    
    // State setters for external updates
    setClients,
    setProducts,
    setWorkers,
  };
};
