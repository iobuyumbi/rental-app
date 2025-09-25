import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { ordersAPI, inventoryAPI } from '../services/api';
import { toast } from 'sonner';
import useDataManager from '../hooks/useDataManager';
import useFormManager from '../hooks/useFormManager';
import { useAuth } from '../context/AuthContext';

// Import our new components
import OrdersTable from '../components/orders/OrdersTable';
import OrderForm from '../components/orders/OrderForm';

const OrdersPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Product selection state for order items
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState([]);

  // Memoize API functions to prevent infinite re-renders
  const fetchOrders = useCallback(() => ordersAPI.getOrders({}), []);
  const createOrderFn = useCallback((data) => ordersAPI.createOrder(data), []);
  const updateOrderFn = useCallback((id, data) => ordersAPI.updateOrder(id, data), []);

  // Data management for orders
  const {
    data: orders,
    loading,
    error,
    createItem: createOrder,
    updateItem: updateOrder,
    refresh: loadOrders
  } = useDataManager({
    fetchFn: fetchOrders,
    createFn: createOrderFn,
    updateFn: updateOrderFn,
    entityName: 'order'
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
      location: '', // Add optional location field
      orderCompany: '' // Add order-specific company field
    },
    {
      client: { required: true },
      startDate: { required: true },
      endDate: { required: true }
    },
    async (formData, event) => {
      event.preventDefault(); // Prevent default form submission
      
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
        if (editingOrder) {
          await updateOrder(editingOrder._id, orderData);
          toast.success('Order updated successfully');
        } else {
          await createOrder(orderData);
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
      console.log('Loading clients and products for orders...');
      const [clientsRes, productsRes] = await Promise.all([
        ordersAPI.getClients(),
        inventoryAPI.products.get()
      ]);
      
      console.log('Raw clients response:', clientsRes);
      console.log('Raw products response:', productsRes);
      
      // Use consistent data extraction pattern
      const clientsData = clientsRes?.data || clientsRes || [];
      const productsData = productsRes?.data || productsRes || [];
      
      console.log('Extracted clients data:', clientsData);
      console.log('Extracted products data:', productsData);
      
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error loading supporting data:', error);
      toast.error('Failed to load supporting data');
      setClients([]);
      setProducts([]);
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
    setOrderItems(order.items || []);
    orderForm.updateValues({
      client: order.client?._id || order.client,
      startDate: order.startDate?.split('T')[0] || '',
      endDate: order.endDate?.split('T')[0] || '',
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

  console.log('Clients state:', clients);
  console.log('Client options for dropdown:', clientOptions);

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
      </div>

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        loading={loading}
        onAddOrder={handleAddOrder}
        onEditOrder={handleEditOrder}
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
    </div>
  );
};

export default OrdersPage;
