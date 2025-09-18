import { useState, useEffect, useCallback } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import {
  ShoppingCart,
  Calendar,
  User,
  Package,
  Clock,
  X,
  PlusCircle,
  MinusCircle,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Plus
} from 'lucide-react';
import { ordersAPI, inventoryAPI } from '../services/api';
import { toast } from 'sonner';
import DataTable from '../components/common/DataTable';
import FormModal, { FormInput, FormSelect, FormTextarea } from '../components/common/FormModal';
import { useDataManager } from '../hooks/useDataManager';
import { useFormManager } from '../hooks/useFormManager';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

const paymentStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' }
];

const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'confirmed': return 'default';
    case 'in_progress': return 'outline';
    case 'completed': return 'default';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

const getPaymentStatusBadgeVariant = (status) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'partial': return 'outline';
    case 'paid': return 'default';
    case 'refunded': return 'destructive';
    default: return 'secondary';
  }
};

const OrdersPage = () => {
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
      taxRate: 16
    },
    {
      client: { required: true },
      startDate: { required: true },
      endDate: { required: true }
    },
    async (formData) => {
      const orderData = {
        ...formData,
        items: orderItems,
        deposit: parseFloat(formData.deposit) || 0,
        discount: parseFloat(formData.discount) || 0,
        taxRate: parseFloat(formData.taxRate) || 16
      };

      if (editingOrder) {
        await updateOrder(editingOrder._id, orderData);
      } else {
        await createOrder(orderData);
      }
      
      handleCloseModal();
    }
  );

  // Load supporting data on component mount
  useEffect(() => {
    loadSupportingData();
  }, []);

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

  // Calculate order totals
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discount = parseFloat(orderForm.values.discount) || 0;
    const taxRate = parseFloat(orderForm.values.taxRate) || 16;
    const discountAmount = subtotal * (discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * (taxRate / 100);
    const total = taxableAmount + tax;

    return { subtotal, discountAmount, tax, total };
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
      notes: order.notes || ''
    });
    setShowAddOrder(true);
  };

  // Deleting orders is not supported by the API at this time.

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

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Client options for form
  const clientOptions = clients.map(client => ({
    value: client._id,
    label: client.name
  }));
  
  console.log('Clients state:', clients);
  console.log('Client options for dropdown:', clientOptions);

  // Define table columns
  const orderColumns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (order) => (
        <div className="font-medium">
          #{order._id?.slice(-6).toUpperCase()}
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      render: (order) => (
        <div>
          <div className="font-medium">{order.client?.name || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{order.client?.email}</div>
        </div>
      )
    },
    {
      key: 'dates',
      label: 'Rental Period',
      render: (order) => (
        <div className="text-sm">
          <div>{formatDate(order.startDate)}</div>
          <div className="text-gray-500">to {formatDate(order.endDate)}</div>
        </div>
      )
    },
    {
      key: 'items',
      label: 'Items',
      render: (order) => (
        <div className="text-sm">
          <div className="font-medium">{order.items?.length || 0} items</div>
          <div className="text-gray-500">
            {order.items?.slice(0, 2).map(item => item.productName).join(', ')}
            {order.items?.length > 2 && '...'}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (order) => (
        <div className="text-right">
          <div className="font-medium">KES {order.totalAmount?.toLocaleString()}</div>
          <div className="text-sm text-gray-500">
            Paid: KES {order.amountPaid?.toLocaleString() || '0'}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => (
        <div className="space-y-1">
          <Badge variant={getStatusBadgeVariant(order.status)}>
            {order.status}
          </Badge>
          <div>
            <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)} className="text-xs">
              {order.paymentStatus}
            </Badge>
          </div>
        </div>
      )
    }
  ];

  const totals = calculateTotals();

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
      <DataTable
        title="Orders"
        description="Manage all rental orders"
        columns={orderColumns}
        data={orders}
        onAdd={handleAddOrder}
        onEdit={handleEditOrder}
        // onDelete not provided: delete is not supported by API
        addLabel="Create Order"
        searchable={true}
        searchPlaceholder="Search orders by client, order number..."
        loading={loading}
        emptyMessage="No orders found. Create your first order to get started."
        emptyIcon={ShoppingCart}
      />

      {/* Order Form Modal */}
      <FormModal
        isOpen={showAddOrder}
        onOpenChange={(open) => !open && handleCloseModal()}
        title={editingOrder ? 'Edit Order' : 'Create New Order'}
        onSubmit={orderForm.handleSubmit}
        loading={orderForm.isSubmitting}
      >
        <FormSelect
          label="Client"
          name="client"
          value={orderForm.values.client || ''}
          onChange={(e) => orderForm.handleChange('client', e.target.value)}
          error={orderForm.errors.client}
          required
          options={clientOptions}
          placeholder="Select client"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Start Date"
            name="startDate"
            type="date"
            value={orderForm.values.startDate || ''}
            onChange={orderForm.handleChange}
            error={orderForm.errors.startDate}
            required
          />
          
          <FormInput
            label="End Date"
            name="endDate"
            type="date"
            value={orderForm.values.endDate || ''}
            onChange={orderForm.handleChange}
            error={orderForm.errors.endDate}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Status"
            name="status"
            value={orderForm.values.status || 'pending'}
            onChange={orderForm.handleChange}
            error={orderForm.errors.status}
            required
            options={statusOptions}
          />
          
          <FormSelect
            label="Payment Status"
            name="paymentStatus"
            value={orderForm.values.paymentStatus || 'pending'}
            onChange={orderForm.handleChange}
            error={orderForm.errors.paymentStatus}
            required
            options={paymentStatusOptions}
          />
        </div>

        {/* Product Selection */}
        <div className="space-y-4">
          <label className="text-sm font-medium">Add Products</label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {productSearch && filteredProducts.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {filteredProducts.slice(0, 5).map((product) => (
                    <div
                      key={product._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedProduct(product);
                        setProductSearch(product.name);
                      }}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        KES {product.rentalPrice} - Stock: {product.quantityInStock}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input
              type="number"
              placeholder="Qty"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
            <Button
              type="button"
              onClick={addItemToOrder}
              disabled={!selectedProduct}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Order Items List */}
        {orderItems.length > 0 && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>KES {item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell>KES {(item.quantity * item.unitPrice).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Order Summary */}
            <div className="border-t p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>KES {totals.subtotal.toLocaleString()}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({orderForm.values.discount}%):</span>
                  <span>-KES {totals.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax ({orderForm.values.taxRate}%):</span>
                <span>KES {totals.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total:</span>
                <span>KES {totals.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <FormInput
            label="Deposit (KES)"
            name="deposit"
            type="number"
            value={orderForm.values.deposit || ''}
            onChange={orderForm.handleChange}
            error={orderForm.errors.deposit}
            min="0"
            step="0.01"
            placeholder="0.00"
          />
          
          <FormInput
            label="Discount (%)"
            name="discount"
            type="number"
            value={orderForm.values.discount || ''}
            onChange={orderForm.handleChange}
            error={orderForm.errors.discount}
            min="0"
            max="100"
            step="0.01"
            placeholder="0.00"
          />
          
          <FormInput
            label="Tax Rate (%)"
            name="taxRate"
            type="number"
            value={orderForm.values.taxRate || 16}
            onChange={orderForm.handleChange}
            error={orderForm.errors.taxRate}
            min="0"
            max="100"
            step="0.01"
            placeholder="16.00"
          />
        </div>

        <FormTextarea
          label="Notes"
          name="notes"
          value={orderForm.values.notes || ''}
          onChange={orderForm.handleChange}
          error={orderForm.errors.notes}
          placeholder="Additional notes about the order..."
          rows={3}
        />
      </FormModal>
    </div>
  );
};

export default OrdersPage;
