import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Plus, X as XIcon, Users } from 'lucide-react';
import { ordersAPI, inventoryAPI, workersAPI } from '../services/api';
import { workerTasksAPI } from '../api/workerTasksAPI';
import { toast } from 'sonner';
import useDataManager from '../hooks/useDataManager';
import useFormManager from '../hooks/useFormManager';
import { useAuth } from '../context/AuthContext';

// Import our components
import OrdersTable from '../components/orders/OrdersTable';
import OrderForm from '../components/orders/OrderForm';
import WorkerTaskModal from '../components/worker-tasks/WorkerTaskModal';
import OrderWorkflowButtons from '../components/orders/OrderWorkflowButtons';
import OrderTaskHistory from '../components/orders/OrderTaskHistory';
import StatusChangeHandler from '../components/orders/StatusChangeHandler';

const OrdersPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Worker task state
  const [showWorkerTaskModal, setShowWorkerTaskModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [taskHistoryRefresh, setTaskHistoryRefresh] = useState(0);
  
  // Status change tracking
  const [statusChangeData, setStatusChangeData] = useState(null);
  const [showStatusChangeHandler, setShowStatusChangeHandler] = useState(false);

  // Product selection state for order items
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState([]);

  // Memoize API functions to prevent infinite re-renders
  const fetchOrders = useCallback(() => ordersAPI.getOrders({}), []);
  const createOrderFn = useCallback((data) => ordersAPI.createOrder(data), []);
  const updateOrderFn = useCallback((id, data) => ordersAPI.updateOrder(id, data), []);
  const deleteOrderFn = useCallback((id) => ordersAPI.deleteOrder(id), []);
  
  // Worker task API functions
  const createWorkerTaskFn = useCallback((data) => workerTasksAPI.tasks.create(data), []);
  const updateWorkerTaskFn = useCallback((id, data) => workerTasksAPI.tasks.update(id, data), []);

  // Data management for orders
  const {
    data: orders,
    loading,
    error,
    createItem: createOrder,
    updateItem: updateOrder,
    deleteItem: deleteOrder,
    refresh: loadOrders
  } = useDataManager({
    fetchFn: fetchOrders,
    createFn: createOrderFn,
    updateFn: updateOrderFn,
    deleteFn: deleteOrderFn,
    entityName: 'order'
  });

  // Debug logging for orders
  useEffect(() => {
    console.log('Orders data received:', {
      count: orders?.length || 0,
      orders: orders,
      loading,
      error
    });
  }, [orders, loading, error]);

  // Test API connection
  const testAPIConnection = async () => {
    try {
      console.log('Testing API connection...');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API Response Status:', response.status);
      const data = await response.json();
      console.log('Raw API Response:', data);
      
      toast.success(`API Test: ${response.status} - ${data?.length || 'No'} orders found`);
    } catch (error) {
      console.error('API Test Error:', error);
      toast.error(`API Test Failed: ${error.message}`);
    }
  };

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
      location: '', // Add optional location field
      orderCompany: '' // Add order-specific company field
    },
    {
      client: { required: true },
      startDate: { required: true },
      endDate: { required: true }
    },
    async (formData, event) => {
      // Prevent default form submission if event is provided
      if (event) {
        event.preventDefault();
      }
      
      // Validate that there are items in the order
      if (orderItems.length === 0) {
        toast.error('Please add at least one product to the order');
        return;
      }

      const orderData = {
        client: formData.client,
        rentalStartDate: formData.startDate,
        rentalEndDate: formData.endDate,
        items: orderItems,
        notes: formData.notes,
        deposit: parseFloat(formData.deposit) || 0,
        discount: parseFloat(formData.discount) || 0,
        taxRate: parseFloat(formData.taxRate) || 16,
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        location: formData.location || '', // Add location to order data
        orderCompany: formData.orderCompany || '' // Add order-specific company
      };

      try {
        let updatedOrder;
        
        if (editingOrder) {
          // Check if status is changing to 'in_progress' or 'completed'
          const previousStatus = editingOrder.status;
          const newStatus = orderData.status;
          
          updatedOrder = await updateOrder(editingOrder._id, orderData);
          toast.success('Order updated successfully');
          
          // Trigger status change handler if status changed to key states
          if (previousStatus !== newStatus && 
              (newStatus === 'in_progress' || newStatus === 'completed')) {
            
            setStatusChangeData({
              order: { ...editingOrder, ...orderData },
              previousStatus,
              newStatus
            });
            setShowStatusChangeHandler(true);
          }
        } else {
          updatedOrder = await createOrder(orderData);
          toast.success('Order created successfully');
        }
        
        handleCloseModal();
        loadOrders(); // Refresh the orders list
      } catch (error) {
        console.error('Error saving order:', error);
        toast.error(error.message || 'Failed to save order');
      }
    }
  );

  // Calculate order totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return { subtotal };
  };

  const totals = calculateTotals();

  // Format client options for the dropdown - show individual names prominently
  const clientOptions = React.useMemo(() => {
    return clients.map(client => ({
      ...client,
      label: client.name, // Show individual's name prominently
      value: client._id
    }));
  }, [clients]);

  // Load supporting data on component mount
  useEffect(() => {
    loadSupportingData();
  }, []);
  
  // Load workers data
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        // Use the correct workersAPI
        const response = await workersAPI.workers.get();
        const workersData = response?.data || response || [];
        setWorkers(Array.isArray(workersData) ? workersData : []);
      } catch (error) {
        console.error('Error loading workers:', error);
        toast.error('Failed to load workers data');
        setWorkers([]);
      }
    };
    
    loadWorkers();
  }, []);

  // Auto-calculate discount percentage from deposit when payment status is "paid"
  useEffect(() => {
    if (orderForm.values.paymentStatus === 'paid' && orderForm.values.deposit > 0 && totals.subtotal > 0) {
      // Calculate discount: (expected_price - deposit_paid) / expected_price * 100
      const expectedPrice = totals.subtotal;
      const depositPaid = parseFloat(orderForm.values.deposit);
      const discountAmount = expectedPrice - depositPaid;
      const discountPercentage = (discountAmount / expectedPrice) * 100;
      orderForm.setValue('discount', Math.max(0, Math.min(discountPercentage, 100))); // Cap between 0-100%
    } else if (orderForm.values.paymentStatus !== 'paid') {
      orderForm.setValue('discount', 0);
    }
  }, [orderForm.values.paymentStatus, orderForm.values.deposit, totals.subtotal]);

  const loadSupportingData = async () => {
    try {
      const [clientsRes, productsRes] = await Promise.all([
        ordersAPI.getClients(),
        inventoryAPI.products.get()
      ]);
      
      // Use consistent data extraction pattern
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
  
  // Worker task handlers
  const handleOpenWorkerTaskModal = (order) => {
    setSelectedOrder(order);
    setEditingTask(null);
    setShowWorkerTaskModal(true);
  };
  
  const handleEditWorkerTask = (task) => {
    setEditingTask(task);
    setSelectedOrder(task.order);
    setShowWorkerTaskModal(true);
  };
  
  const handleCloseWorkerTaskModal = () => {
    setShowWorkerTaskModal(false);
    setSelectedOrder(null);
    setEditingTask(null);
  };
  
  const handleSubmitWorkerTask = async (taskData) => {
    try {
      if (editingTask) {
        await updateWorkerTaskFn(editingTask._id, taskData);
      } else {
        await createWorkerTaskFn(taskData);
      }
      handleCloseWorkerTaskModal();
      // Optionally refresh orders or tasks list
      loadOrders();
      return true;
    } catch (error) {
      console.error('Error saving worker task:', error);
      throw error;
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowAddOrder(false);
    setEditingOrder(null);
    setOrderItems([]);
    setProductSearch('');
    setSelectedProduct(null);
    setQuantity(1);
    orderForm.reset();
  };


  // Order handlers
  const handleAddOrder = () => {
    setEditingOrder(null);
    setOrderItems([]);
    orderForm.reset();
    setShowAddOrder(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    
    // Debug: Log the order data to see what fields are available
    console.log('Editing order:', order);
    console.log('Rental dates:', {
      rentalStartDate: order.rentalStartDate,
      rentalEndDate: order.rentalEndDate,
      startDate: order.startDate,
      endDate: order.endDate
    });
    
    // Map order items from database format to form format
    const mappedItems = (order.items || []).map(item => ({
      productId: item.product?._id || item.product,
      productName: item.product?.name || item.productName || 'Unknown Product',
      quantity: item.quantityRented || item.quantity || 1,
      unitPrice: item.unitPriceAtTimeOfRental || item.unitPrice || 0,
      priceModifiedBy: item.priceModifiedBy
    }));
    
    setOrderItems(mappedItems);
    
    // Extract dates with fallback to both possible field names
    const startDate = order.rentalStartDate?.split('T')[0] || order.startDate?.split('T')[0] || '';
    const endDate = order.rentalEndDate?.split('T')[0] || order.endDate?.split('T')[0] || '';
    
    console.log('Mapped dates for form:', { startDate, endDate });
    
    orderForm.updateValues({
      client: order.client?._id || order.client,
      startDate,
      endDate,
      status: order.status,
      paymentStatus: order.paymentStatus,
      deposit: order.deposit || 0,
      discount: order.discount || 0,
      taxRate: order.taxRate || 16,
      notes: order.notes || '',
      location: order.location || '', // Add location field for editing
      orderCompany: order.orderCompany || '' // Add order-specific company for editing
    });
    setShowAddOrder(true);
  };

  const handleViewOrder = (order) => {
    setViewingOrder(order);
    setShowViewModal(true);
  };

  // Product management functions
  const addItemToOrder = () => {
    if (!selectedProduct || !quantity) return;

    const existingItemIndex = orderItems.findIndex(item => item.productId === selectedProduct._id);
    
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
        unitPrice: selectedProduct.rentalPrice
      };
      setOrderItems([...orderItems, newItem]);
    }

    // Reset selection
    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
  };

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...orderItems];
    updatedItems[index].quantity = newQuantity;
    setOrderItems(updatedItems);
  };

  const updateItemUnitPrice = (index, newPrice, user) => {
    const updatedItems = [...orderItems];
    updatedItems[index].unitPrice = newPrice;
    updatedItems[index].priceModifiedBy = user?.name || 'Unknown User';
    updatedItems[index].priceModifiedAt = new Date().toISOString();
    setOrderItems(updatedItems);
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );


  const handleFormChange = (field, value) => {
    orderForm.handleChange(field, value);
  };

  // Handle adding new client from OrderForm
  const handleAddNewClient = async (clientData) => {
    try {
      const newClient = await ordersAPI.addClient(clientData);
      
      // Add the new client to the clients list
      setClients(prev => [...prev, newClient]);
      
      toast.success('New client created successfully!');
      return newClient;
    } catch (error) {
      console.error('Error creating new client:', error);
      toast.error('Failed to create new client');
      throw error; // Re-throw so the OrderForm can handle it
    }
  };

  // Handle task creation from workflow buttons
  const handleWorkflowTaskCreated = async (taskData) => {
    try {
      await createWorkerTaskFn(taskData);
      toast.success('Worker task recorded successfully');
      // Refresh task history and orders
      setTaskHistoryRefresh(prev => prev + 1);
      loadOrders();
    } catch (error) {
      console.error('Error creating workflow task:', error);
      throw error;
    }
  };

  // Handle task editing from history
  const handleEditTaskFromHistory = (task) => {
    setEditingTask(task);
    setSelectedOrder(viewingOrder);
    setShowWorkerTaskModal(true);
  };

  // Handle task deletion from history
  const handleDeleteTaskFromHistory = async (taskId) => {
    try {
      await workerTasksAPI.tasks.delete(taskId);
      toast.success('Worker task deleted successfully');
      setTaskHistoryRefresh(prev => prev + 1);
      loadOrders();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete worker task');
      throw error;
    }
  };

  // Handler for status change task creation
  const handleStatusChangeTaskCreated = async (taskData) => {
    try {
      console.log('Creating status change task:', taskData);
      // The task creation is handled by the WorkerTaskModal
      // We just need to refresh data after completion
      await loadOrders();
      toast.success('Worker task recorded successfully');
      
      // Also trigger a refresh of inventory data if available
      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('inventoryUpdated'));
      }
      // Reset status change handler state
      setShowStatusChangeHandler(false);
      setStatusChangeData(null);
    } catch (error) {
      console.error('Error in status change task creation:', error);
      toast.error('Failed to record worker task');
    }
  };

  // Handle status change handler completion
  const handleStatusChangeComplete = () => {
    setShowStatusChangeHandler(false);
    setStatusChangeData(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
          <p className="text-muted-foreground">
            Manage rental orders, track inventory, and process payments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={testAPIConnection} variant="outline" size="sm">
            Test API
          </Button>
          <Button onClick={loadOrders} variant="outline" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh Orders'}
          </Button>
          <div className="text-sm text-gray-500">
            {orders?.length || 0} orders loaded
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-800">
              <strong>Error loading orders:</strong> {error}
            </div>
            <Button 
              onClick={loadOrders} 
              variant="outline" 
              size="sm" 
              className="ml-4"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 border rounded-lg p-4 text-xs">
          <strong>Debug Info:</strong> 
          Loading: {loading ? 'Yes' : 'No'} | 
          Orders Count: {orders?.length || 0} | 
          Error: {error || 'None'} |
          API URL: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
        </div>
      )}

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        loading={loading}
        onAddOrder={handleAddOrder}
        onEditOrder={handleEditOrder}
        onViewOrder={handleViewOrder}
        onDeleteOrder={deleteOrder}
      />

      {/* Order Form Modal */}
      <OrderForm
        isOpen={showAddOrder}
        onClose={handleCloseModal}
        onSubmit={orderForm.handleSubmit}
        formData={orderForm.values}
        onFormChange={handleFormChange}
        errors={orderForm.errors}
        isSubmitting={orderForm.isSubmitting}
        editingOrder={editingOrder}
        clientOptions={clientOptions}
        onAddNewClient={handleAddNewClient}
        // Product selection props
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        quantity={quantity}
        setQuantity={setQuantity}
        filteredProducts={filteredProducts}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        orderItems={orderItems}
        onAddItem={addItemToOrder}
        onUpdateQuantity={updateItemQuantity}
        onUpdateUnitPrice={updateItemUnitPrice}
        onRemoveItem={removeItem}
        totals={totals}
        currentUser={user}
      />

      {/* Order View Modal */}
      {showViewModal && viewingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Order #{viewingOrder._id.slice(-6).toUpperCase()}</h2>
                <p className="text-gray-500 mt-1">Order Details and Items</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Client Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Client Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Contact Person:</span>
                  <div className="font-medium">{viewingOrder.client?.contactPerson || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Company:</span>
                  <div className="font-medium">{viewingOrder.client?.name || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <div className="font-medium">{viewingOrder.client?.phone || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <div className="font-medium">{viewingOrder.client?.email || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Order Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Rental Period:</span>
                  <div className="font-medium">
                    {formatDate(viewingOrder.rentalStartDate)} - {formatDate(viewingOrder.rentalEndDate)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div>{viewingOrder.status}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Amount:</span>
                  <div className="font-medium">KES {viewingOrder.totalAmount?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600">Amount Paid:</span>
                  <div className="font-medium">
                    KES {(() => {
                      const totalAmount = viewingOrder.totalAmount || 0;
                      const deposit = viewingOrder.deposit || 0;
                      let amountPaid = viewingOrder.amountPaid || 0;
                      
                      // If payment status is 'paid' but amountPaid is 0, assume full payment
                      if (viewingOrder.paymentStatus === 'paid' && amountPaid === 0) {
                        amountPaid = totalAmount;
                      }
                      // If there's a deposit but no recorded amountPaid, show at least the deposit
                      else if (deposit > 0 && amountPaid === 0) {
                        amountPaid = deposit;
                      }
                      // If there's both deposit and amountPaid, ensure amountPaid includes deposit
                      else if (deposit > 0 && amountPaid > 0 && amountPaid < deposit) {
                        amountPaid = deposit;
                      }
                      
                      return amountPaid.toLocaleString();
                    })()}
                    {(() => {
                      const deposit = viewingOrder.deposit || 0;
                      const totalAmount = viewingOrder.totalAmount || 0;
                      let amountPaid = viewingOrder.amountPaid || 0;
                      
                      // Apply same logic to determine final amountPaid
                      if (viewingOrder.paymentStatus === 'paid' && amountPaid === 0) {
                        amountPaid = totalAmount;
                      } else if (deposit > 0 && amountPaid === 0) {
                        amountPaid = deposit;
                      } else if (deposit > 0 && amountPaid > 0 && amountPaid < deposit) {
                        amountPaid = deposit;
                      }
                      
                      return deposit > 0 && amountPaid !== totalAmount ? (
                        <div className="text-xs text-blue-600 mt-1">
                          (Includes deposit: KES {deposit.toLocaleString()})
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Order Items ({viewingOrder.items?.length || 0})</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {viewingOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.product?.name || item.productName || 'Unknown Product'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {item.quantityRented || item.quantity || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          KES {(item.unitPriceAtTimeOfRental || item.unitPrice || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          KES {((item.quantityRented || item.quantity || 0) * (item.unitPriceAtTimeOfRental || item.unitPrice || 0)).toLocaleString()}
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {viewingOrder.notes && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-gray-700">{viewingOrder.notes}</p>
              </div>
            )}

            {/* Task History */}
            <div className="mb-6 p-4 border rounded-lg">
              <OrderTaskHistory
                order={viewingOrder}
                onEditTask={handleEditTaskFromHistory}
                onDeleteTask={handleDeleteTaskFromHistory}
                refreshTrigger={taskHistoryRefresh}
              />
            </div>

            {/* Workflow Buttons */}
            <div className="mb-6 p-4 border rounded-lg">
              <OrderWorkflowButtons
                order={viewingOrder}
                workers={workers}
                onTaskCreated={handleWorkflowTaskCreated}
                disabled={viewingOrder.status === 'cancelled'}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Worker Task Modal */}
      {showWorkerTaskModal && (
        <WorkerTaskModal
          isOpen={showWorkerTaskModal}
          onClose={handleCloseWorkerTaskModal}
          order={selectedOrder}
          workers={workers}
          onSubmit={handleSubmitWorkerTask}
          existingTask={editingTask}
        />
      )}

      {/* Status Change Handler - Automatic task recording on status changes */}
      {showStatusChangeHandler && statusChangeData && (
        <StatusChangeHandler
          order={statusChangeData.order}
          previousStatus={statusChangeData.previousStatus}
          newStatus={statusChangeData.newStatus}
          workers={workers}
          onTaskCreated={handleStatusChangeTaskCreated}
          onComplete={handleStatusChangeComplete}
          onOrderUpdate={updateOrder}
        />
      )}
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

export default OrdersPage;
