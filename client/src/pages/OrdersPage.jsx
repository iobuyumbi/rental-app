import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ShoppingCart,
  Calendar,
  User,
  Package,
  Clock,
  X,
  PlusCircle,
  MinusCircle,
  PackagePlus,
  CheckCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { ordersAPI, inventoryAPI } from '../services/api';
import { toast } from 'sonner';
import DataTable from '../components/common/DataTable';
import SearchFilters from '../components/common/SearchFilters';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const OrdersPage = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Form state
  const [newOrder, setNewOrder] = useState({
    client: '',
    items: [],
    startDate: '',
    endDate: '',
    status: 'pending',
    notes: '',
    paymentStatus: 'pending',
    deposit: 0,
    totalAmount: 0,
    discount: 0,
    taxRate: 16,
  });

  // Product selection state
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersResponse, clientsResponse, productsResponse] = await Promise.all([
        ordersAPI.getOrders({}),
        ordersAPI.getClients(),
        inventoryAPI.getAvailableProducts()
      ]);
      
      setOrders(Array.isArray(ordersResponse) ? ordersResponse : []);
      setClients(Array.isArray(clientsResponse) ? clientsResponse : []);
      setProducts(Array.isArray(productsResponse) ? productsResponse : []);
    } catch (error) {
      console.error('Error loading orders data:', error);
      toast.error('Failed to load orders data');
      setOrders([]);
      setClients([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on search criteria
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.phone?.includes(searchTerm) ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === '__all__' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!showAddOrder) {
      setEditingOrder(null);
      setProductSearch('');
      setSelectedProduct(null);
      setQuantity(1);
      setNewOrder({
        client: '',
        items: [],
        startDate: '',
        endDate: '',
        status: 'pending',
        notes: '',
        paymentStatus: 'pending',
        deposit: 0,
        totalAmount: 0,
        discount: 0,
        taxRate: 16,
      });
    }
  }, [showAddOrder]);

  // Calculate order totals
  useEffect(() => {
    const subtotal = newOrder.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discount = parseFloat(newOrder.discount) || 0;
    const taxRate = parseFloat(newOrder.taxRate) || 0;
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const tax = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + tax;

    setNewOrder(prev => ({
      ...prev,
      subtotal,
      discountAmount,
      tax,
      totalAmount: total
    }));
  }, [newOrder.items, newOrder.discount, newOrder.taxRate]);

  // Order form handlers
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        ...newOrder,
        deposit: parseFloat(newOrder.deposit) || 0,
        discount: parseFloat(newOrder.discount) || 0,
        taxRate: parseFloat(newOrder.taxRate) || 16,
      };

      if (editingOrder) {
        await ordersAPI.updateOrder(editingOrder._id, orderData);
        toast.success('Order updated successfully');
      } else {
        await ordersAPI.createOrder(orderData);
        toast.success('Order created successfully');
      }

      setShowAddOrder(false);
      loadData();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setNewOrder({
      client: order.client?._id || '',
      items: order.items || [],
      startDate: order.startDate?.split('T')[0] || '',
      endDate: order.endDate?.split('T')[0] || '',
      status: order.status || 'pending',
      notes: order.notes || '',
      paymentStatus: order.paymentStatus || 'pending',
      deposit: order.deposit || 0,
      totalAmount: order.totalAmount || 0,
      discount: order.discount || 0,
      taxRate: order.taxRate || 16,
    });
    setShowAddOrder(true);
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await ordersAPI.deleteOrder(id);
        toast.success('Order deleted successfully');
        loadData();
      } catch (error) {
        console.error('Error deleting order:', error);
        toast.error('Failed to delete order');
      }
    }
  };

  // Product management functions
  const addItemToOrder = () => {
    if (!selectedProduct || quantity <= 0) return;

    const newItem = {
      product: selectedProduct._id,
      productName: selectedProduct.name,
      quantity: parseInt(quantity),
      unitPrice: selectedProduct.rentalPrice || 0,
    };

    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
  };

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) return;
    
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity: parseInt(newQuantity) } : item
      )
    }));
  };

  const removeItem = (index) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShoppingCart className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  // Define order table columns
  const orderColumns = [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'client', label: 'Client' },
    { key: 'items', label: 'Items' },
    { key: 'dates', label: 'Rental Period' },
    { key: 'totalAmount', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'paymentStatus', label: 'Payment' }
  ];

  // Search filters configuration
  const searchFilters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: setStatusFilter,
      placeholder: 'All statuses',
      allLabel: 'All statuses',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    }
  ];

  // Custom cell renderer for orders
  const renderOrderCell = (order, column) => {
    switch (column.key) {
      case 'orderNumber':
        return (
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4 text-gray-400" />
            <span className="font-medium">#{order._id?.slice(-6) || 'N/A'}</span>
          </div>
        );
      case 'client':
        return (
          <div>
            <div className="font-medium">{order.client?.name || 'N/A'}</div>
            <div className="text-sm text-gray-500">{order.client?.phone || ''}</div>
          </div>
        );
      case 'items':
        return `${order.items?.length || 0} items`;
      case 'dates':
        return (
          <div className="text-sm">
            <div>{formatDate(order.startDate)} -</div>
            <div>{formatDate(order.endDate)}</div>
          </div>
        );
      case 'totalAmount':
        return `Ksh ${order.totalAmount?.toLocaleString() || '0'}`;
      case 'status':
        return (
          <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
            {order.status}
          </Badge>
        );
      case 'paymentStatus':
        return (
          <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'secondary'}>
            {order.paymentStatus}
          </Badge>
        );
      default:
        return order[column.key] || 'N/A';
    }
  };

  // Filter products for selection
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.type?.toLowerCase().includes(productSearch.toLowerCase())
  );

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

      {/* Tabs Interface */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Orders ({filteredOrders.length})</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Calendar</span>
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Rental Orders</CardTitle>
                  <CardDescription>Manage customer orders and rental periods</CardDescription>
                </div>
                <Button onClick={() => setShowAddOrder(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Order
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filters={searchFilters}
              />
              
              <DataTable
                columns={orderColumns}
                data={filteredOrders}
                onEdit={handleEditOrder}
                onDelete={handleDeleteOrder}
                renderCell={renderOrderCell}
                emptyMessage="No orders found"
                emptyIcon={ShoppingCart}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'confirmed' || o.status === 'in_progress').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Ksh {orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting confirmation
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Calendar</CardTitle>
              <CardDescription>View orders by rental dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Calendar view coming soon</p>
                <p className="text-sm text-gray-400">Track rental periods and availability</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Form Dialog */}
      <Dialog open={showAddOrder} onOpenChange={setShowAddOrder}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? 'Edit Order' : 'Create New Order'}
            </DialogTitle>
            <DialogDescription>
              {editingOrder ? 'Update order information' : 'Create a new rental order'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOrderSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select
                  value={newOrder.client}
                  onValueChange={(value) => setNewOrder({ ...newOrder, client: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name} - {client.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newOrder.status}
                  onValueChange={(value) => setNewOrder({ ...newOrder, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newOrder.startDate}
                  onChange={(e) => setNewOrder({ ...newOrder, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newOrder.endDate}
                  onChange={(e) => setNewOrder({ ...newOrder, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Product Selection */}
            <div className="space-y-4">
              <Label>Add Products</Label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
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
                            Ksh {product.rentalPrice} - Stock: {product.quantityInStock}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="Qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-20"
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

            {/* Order Items */}
            <div className="space-y-2">
              <Label>Order Items</Label>
              {newOrder.items.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newOrder.items.map((item, index) => (
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
                          <TableCell>Ksh {item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell>Ksh {(item.quantity * item.unitPrice).toLocaleString()}</TableCell>
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
                      <span>Ksh {newOrder.subtotal?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({newOrder.taxRate}%):</span>
                      <span>Ksh {newOrder.tax?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total:</span>
                      <span>Ksh {newOrder.totalAmount?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500">No items added to this order</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newOrder.notes}
                onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                placeholder="Additional notes about the order..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddOrder(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingOrder ? 'Update Order' : 'Create Order'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
