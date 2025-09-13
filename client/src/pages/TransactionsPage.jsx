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
  Wrench, 
  Plus, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { transactionsAPI, inventoryAPI } from '../services/api';
import { toast } from 'sonner';

const TransactionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({});
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showAddRepair, setShowAddRepair] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [newPurchase, setNewPurchase] = useState({
    productId: '',
    quantity: '',
    unitCost: '',
    supplier: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [newRepair, setNewRepair] = useState({
    productId: '',
    description: '',
    cost: '',
    repairDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    technician: ''
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [purchasesRes, repairsRes, productsRes, summaryRes] = await Promise.allSettled([
        transactionsAPI.getPurchases(dateRange),
        transactionsAPI.getRepairs(dateRange),
        inventoryAPI.products.get(),
        transactionsAPI.getTransactionSummary(dateRange)
      ]);

      setPurchases(purchasesRes.status === 'fulfilled' ? (purchasesRes.value.data || []) : []);
      setRepairs(repairsRes.status === 'fulfilled' ? (repairsRes.value.data || []) : []);
      setProducts(productsRes.status === 'fulfilled' ? (productsRes.value.data || []) : []);
      setSummary(summaryRes.status === 'fulfilled' ? (summaryRes.value.data || {}) : {});
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load transactions data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPurchase = async (e) => {
    e.preventDefault();
    try {
      await transactionsAPI.recordPurchase({
        ...newPurchase,
        quantity: parseInt(newPurchase.quantity),
        unitCost: parseFloat(newPurchase.unitCost)
      });
      toast.success('Purchase recorded successfully');
      setShowAddPurchase(false);
      setNewPurchase({
        productId: '',
        quantity: '',
        unitCost: '',
        supplier: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        description: ''
      });
      loadData();
    } catch (error) {
      console.error('Error recording purchase:', error);
      toast.error('Failed to record purchase');
    }
  };

  const handleAddRepair = async (e) => {
    e.preventDefault();
    try {
      await transactionsAPI.recordRepair({
        ...newRepair,
        cost: parseFloat(newRepair.cost)
      });
      toast.success('Repair recorded successfully');
      setShowAddRepair(false);
      setNewRepair({
        productId: '',
        description: '',
        cost: '',
        repairDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        technician: ''
      });
      loadData();
    } catch (error) {
      console.error('Error recording repair:', error);
      toast.error('Failed to record repair');
    }
  };

  const handleUpdateRepair = async (repairId, updates) => {
    try {
      await transactionsAPI.updateRepair(repairId, updates);
      toast.success('Repair updated successfully');
      loadData();
    } catch (error) {
      console.error('Error updating repair:', error);
      toast.error('Failed to update repair');
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p._id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const applyDateFilter = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage purchases and repairs</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate" className="text-sm">From:</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="w-auto"
            />
            <Label htmlFor="endDate" className="text-sm">To:</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="w-auto"
            />
            <Button onClick={applyDateFilter} variant="outline" size="sm">
              Apply Filter
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold">{purchases.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Repairs</p>
                <p className="text-2xl font-bold">{repairs.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Purchase Cost</p>
                <p className="text-2xl font-bold text-green-600">
                  KSH {summary.totalPurchaseCost?.toLocaleString() || '0'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Repair Cost</p>
                <p className="text-2xl font-bold text-red-600">
                  KSH {summary.totalRepairCost?.toLocaleString() || '0'}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="repairs">Repairs</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Purchase Records</CardTitle>
                  <CardDescription>
                    Track inventory purchases and costs
                  </CardDescription>
                </div>
                <Dialog open={showAddPurchase} onOpenChange={setShowAddPurchase}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Purchase
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record New Purchase</DialogTitle>
                      <DialogDescription>
                        Add a new inventory purchase transaction
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddPurchase} className="space-y-4">
                      <div>
                        <Label htmlFor="productId">Product</Label>
                        <Select value={newPurchase.productId} onValueChange={(value) => setNewPurchase(prev => ({ ...prev, productId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product._id} value={product._id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={newPurchase.quantity}
                            onChange={(e) => setNewPurchase(prev => ({ ...prev, quantity: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="unitCost">Unit Cost (KSH)</Label>
                          <Input
                            id="unitCost"
                            type="number"
                            min="0"
                            step="0.01"
                            value={newPurchase.unitCost}
                            onChange={(e) => setNewPurchase(prev => ({ ...prev, unitCost: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          value={newPurchase.supplier}
                          onChange={(e) => setNewPurchase(prev => ({ ...prev, supplier: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="purchaseDate">Purchase Date</Label>
                        <Input
                          id="purchaseDate"
                          type="date"
                          value={newPurchase.purchaseDate}
                          onChange={(e) => setNewPurchase(prev => ({ ...prev, purchaseDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newPurchase.description}
                          onChange={(e) => setNewPurchase(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Additional details about the purchase"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Record Purchase
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No purchases recorded yet</p>
                  <p className="text-sm text-gray-500">Start tracking your inventory purchases</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(purchases) && purchases.map((purchase) => (
                      <TableRow key={purchase._id}>
                        <TableCell className="font-medium">
                          {getProductName(purchase.productId)}
                        </TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell>KSH {purchase.unitCost?.toLocaleString()}</TableCell>
                        <TableCell className="font-bold">
                          KSH {(purchase.quantity * purchase.unitCost)?.toLocaleString()}
                        </TableCell>
                        <TableCell>{purchase.supplier}</TableCell>
                        <TableCell>
                          {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repairs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Repair Records</CardTitle>
                  <CardDescription>
                    Track equipment repairs and maintenance
                  </CardDescription>
                </div>
                <Dialog open={showAddRepair} onOpenChange={setShowAddRepair}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Repair
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record New Repair</DialogTitle>
                      <DialogDescription>
                        Add a new equipment repair transaction
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddRepair} className="space-y-4">
                      <div>
                        <Label htmlFor="repairProductId">Product</Label>
                        <Select value={newRepair.productId} onValueChange={(value) => setNewRepair(prev => ({ ...prev, productId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product._id} value={product._id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="repairDescription">Description</Label>
                        <Textarea
                          id="repairDescription"
                          value={newRepair.description}
                          onChange={(e) => setNewRepair(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe the repair work needed"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="repairCost">Repair Cost (KSH)</Label>
                          <Input
                            id="repairCost"
                            type="number"
                            min="0"
                            step="0.01"
                            value={newRepair.cost}
                            onChange={(e) => setNewRepair(prev => ({ ...prev, cost: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="repairDate">Repair Date</Label>
                          <Input
                            id="repairDate"
                            type="date"
                            value={newRepair.repairDate}
                            onChange={(e) => setNewRepair(prev => ({ ...prev, repairDate: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="repairStatus">Status</Label>
                          <Select value={newRepair.status} onValueChange={(value) => setNewRepair(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="technician">Technician</Label>
                          <Input
                            id="technician"
                            value={newRepair.technician}
                            onChange={(e) => setNewRepair(prev => ({ ...prev, technician: e.target.value }))}
                            placeholder="Repair technician name"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full">
                        Record Repair
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {repairs.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No repairs recorded yet</p>
                  <p className="text-sm text-gray-500">Start tracking equipment repairs</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(repairs) && repairs.map((repair) => (
                      <TableRow key={repair._id}>
                        <TableCell className="font-medium">
                          {getProductName(repair.productId)}
                        </TableCell>
                        <TableCell>{repair.description}</TableCell>
                        <TableCell>KSH {repair.cost?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              repair.status === 'Completed' ? 'default' :
                              repair.status === 'In Progress' ? 'secondary' :
                              repair.status === 'Cancelled' ? 'destructive' : 'outline'
                            }
                          >
                            {repair.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{repair.technician || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(repair.repairDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const newStatus = repair.status === 'Completed' ? 'Pending' : 'Completed';
                                handleUpdateRepair(repair._id, { status: newStatus });
                              }}
                            >
                              {repair.status === 'Completed' ? 
                                <Clock className="h-4 w-4" /> : 
                                <CheckCircle className="h-4 w-4" />
                              }
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Summary</CardTitle>
                <CardDescription>
                  Overview of inventory purchases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total Purchases</p>
                      <p className="text-2xl font-bold text-blue-600">{purchases.length}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="text-2xl font-bold text-green-600">
                        KSH {summary.totalPurchaseCost?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Average Cost</p>
                      <p className="text-2xl font-bold text-purple-600">
                        KSH {summary.averagePurchaseCost?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Repair Summary</CardTitle>
                <CardDescription>
                  Overview of equipment repairs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total Repairs</p>
                      <p className="text-2xl font-bold text-orange-600">{repairs.length}</p>
                    </div>
                    <Wrench className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="text-2xl font-bold text-red-600">
                        KSH {summary.totalRepairCost?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Pending Repairs</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {Array.isArray(repairs) ? repairs.filter(r => r.status === 'Pending' || r.status === 'In Progress').length : 0}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransactionsPage;