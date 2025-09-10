import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
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
  PackagePlus
} from 'lucide-react';
import { ordersAPI } from '../services/api';
import { toast } from 'sonner';
import useApi from '../hooks/useApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const OrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
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
    taxRate: 16 // Default tax rate in Kenya
  });
  
  // State for product selection
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [productList, setProductList] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Fetch orders and products using the useApi hook
  const { 
    data: ordersData = [], 
    loading: ordersLoading, 
    error: ordersError, 
    refetch: refetchOrders 
  } = useApi(() => ordersAPI.getOrders({}));
  
  // Fetch available products
  const { data: availableProducts = [] } = useApi(() => 
    inventoryAPI.getAvailableProducts()
  );

  // Memoized filtered orders
  const filteredOrders = useMemo(() => {
    if (!ordersData || !Array.isArray(ordersData)) return [];
    
    return ordersData.filter(order => {
      const matchesSearch = 
        order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.phone?.includes(searchTerm) ||
        order._id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [ordersData, searchTerm, statusFilter]);

  // Handle API errors
  useEffect(() => {
    if (ordersError) {
      toast.error(`Failed to load orders: ${ordersError.message}`);
    }
  }, [ordersError]);

  // Reset form when dialog is closed
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingOrder(null);
      setProductSearch('');
      setSelectedProduct(null);
      setQuantity(1);
      setFormData({
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
        taxRate: 16
      });
    }
  }, [isDialogOpen]);
  
  // Filter products based on search
  useEffect(() => {
    if (availableProducts && availableProducts.length > 0) {
      const filtered = availableProducts.filter(product => 
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.type.toLowerCase().includes(productSearch.toLowerCase())
      );
      setProductList(filtered);
    }
  }, [productSearch, availableProducts]);
  
  // Calculate order totals whenever items, quantities, or prices change
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * (item.product?.rentalPrice || 0));
    }, 0);
    
    const tax = (subtotal * (formData.taxRate / 100)) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const total = subtotal + tax - discount;
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal,
      tax: tax,
      totalAmount: total > 0 ? total : 0
    }));
  }, [formData.items, formData.discount, formData.taxRate]);
  
  // Add item to order
  const addItemToOrder = () => {
    if (!selectedProduct || quantity < 1) return;
    
    setFormData(prev => {
      const existingItemIndex = prev.items.findIndex(
        item => item.product?._id === selectedProduct._id
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const updatedItems = [...prev.items];
        updatedItems[existingItemIndex].quantity += quantity;
        return { ...prev, items: updatedItems };
      } else {
        // Add new item
        const newItem = {
          product: selectedProduct,
          quantity: quantity,
          unitPrice: selectedProduct.rentalPrice,
          name: selectedProduct.name
        };
        return { ...prev, items: [...prev.items, newItem] };
      }
    });
    
    // Reset selection
    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
  };
  
  // Update item quantity
  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index].quantity = newQuantity;
      return { ...prev, items: updatedItems };
    });
  };
  
  // Remove item from order
  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        deposit: parseFloat(formData.deposit) || 0,
        totalAmount: parseFloat(formData.totalAmount) || 0
      };

      if (editingOrder) {
        await ordersAPI.updateOrder(editingOrder._id, orderData);
        toast.success('Order updated successfully');
      } else {
        await ordersAPI.createOrder(orderData);
        toast.success('Order created successfully');
      }

      setIsDialogOpen(false);
      refetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error(error.response?.data?.message || 'Failed to save order');
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
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
      subtotal: order.subtotal || 0,
      tax: order.tax || 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await ordersAPI.deleteOrder(orderId);
        toast.success('Order deleted successfully');
        refetchOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
        toast.error(error.response?.data?.message || 'Failed to delete order');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage rental orders and clients</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>View and manage all rental orders</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="pl-8 w-full sm:w-[200px] md:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                <p>No orders found</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-gray-500" />
                          {order._id?.substring(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.client?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{order.client?.phone || ''}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.items?.slice(0, 2).map((item, i) => (
                            <div key={i} className="truncate max-w-[150px]">
                              {item.quantity}x {item.product?.name || 'Item'}
                            </div>
                          ))}
                          {order.items?.length > 2 && (
                            <div className="text-xs text-gray-500">+{order.items.length - 2} more</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                          {formatDate(order.startDate)} - {formatDate(order.endDate)}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {order.duration} days
                        </div>
                      </TableCell>
                      <TableCell>Ksh {order.totalAmount?.toLocaleString() || '0'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                          {order.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'outline'}>
                          {order.paymentStatus?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(order._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? 'Edit Order' : 'Create New Order'}
            </DialogTitle>
            <DialogDescription>
              {editingOrder ? 'Update the order details' : 'Enter the order details'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  value={formData.client?.name || ''}
                  onChange={(e) => setFormData({...formData, client: { ...formData.client, name: e.target.value }})}
                  placeholder="Client name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.client?.phone || ''}
                  onChange={(e) => setFormData({...formData, client: { ...formData.client, phone: e.target.value }})}
                  placeholder="Client phone"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select 
                  value={formData.paymentStatus} 
                  onValueChange={(value) => setFormData({...formData, paymentStatus: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deposit">Deposit (Ksh)</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={formData.deposit}
                  onChange={(e) => setFormData({...formData, deposit: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (Ksh)</Label>
                <Input
                  id="discount"
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subtotal (Ksh)</Label>
                <div className="p-2 border rounded-md bg-gray-50">
                  {formData.subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount (Ksh)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Order Items Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Order Items</h4>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1 max-w-xs">
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  <Select 
                    value={selectedProduct?._id || ''} 
                    onValueChange={(value) => {
                      const product = availableProducts.find(p => p._id === value);
                      setSelectedProduct(product || null);
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productList.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.name} - Ksh {product.rentalPrice?.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Input 
                      type="number" 
                      min="1" 
                      value={quantity} 
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
                      className="w-16 text-center"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    type="button" 
                    onClick={addItemToOrder}
                    disabled={!selectedProduct}
                  >
                    <PackagePlus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
              
              {formData.items.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-[100px]">Price</TableHead>
                        <TableHead className="w-[150px]">Quantity</TableHead>
                        <TableHead className="text-right w-[100px]">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="font-medium">{item.product?.name || item.name}</div>
                            <div className="text-xs text-gray-500">{item.product?.type || 'N/A'}</div>
                          </TableCell>
                          <TableCell>Ksh {item.unitPrice?.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => updateItemQuantity(index, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <MinusCircle className="h-4 w-4" />
                              </Button>
                              <Input 
                                type="number" 
                                min="1" 
                                value={item.quantity} 
                                onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)} 
                                className="w-16 text-center"
                              />
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => updateItemQuantity(index, item.quantity + 1)}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            Ksh {(item.quantity * item.unitPrice).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
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
                      <span>Ksh {formData.subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({formData.taxRate}%):</span>
                      <span>Ksh {formData.tax?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total:</span>
                      <span>Ksh {formData.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <Package className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500">No items added to this order</p>
                  <p className="text-sm text-gray-400">Search and add products above</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes about the order..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
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