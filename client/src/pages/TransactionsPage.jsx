import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  ShoppingCart, 
  Wrench, 
  DollarSign, 
  Plus, 
  AlertCircle, 
  Coffee,
  Users,
  CheckCircle,
  Package
} from 'lucide-react';
import { transactionsAPI, inventoryAPI, workersAPI, lunchAllowanceAPI } from '../services/api';
import { toast } from 'sonner';
import DataTable from '../components/common/DataTable';
import FormModal, { FormInput, FormSelect, FormTextarea } from '../components/common/FormModal';
import { useDataManager } from '../hooks/useDataManager';
import { useFormManager } from '../hooks/useFormManager';

const repairStatusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'In Progress': return 'outline';
    case 'Completed': return 'default';
    case 'Cancelled': return 'destructive';
    default: return 'secondary';
  }
};

const TransactionsPage = () => {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({});
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showAddRepair, setShowAddRepair] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [showAddLunchAllowance, setShowAddLunchAllowance] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Create stable functions to prevent infinite re-renders
  const fetchPurchases = useCallback(() => transactionsAPI.getPurchases(dateRange), [dateRange]);
  const createPurchaseFn = useCallback((data) => transactionsAPI.recordPurchase(data), []);

  // Data management for purchases
  const purchasesManager = useDataManager({
    fetchFn: fetchPurchases,
    createFn: createPurchaseFn,
    entityName: 'purchase'
  });

  const {
    data: purchases,
    loading: purchasesLoading,
    createItem: createPurchase,
    refresh: loadPurchases
  } = purchasesManager;

  // Create stable functions to prevent infinite re-renders
  const fetchRepairs = useCallback(() => transactionsAPI.getRepairs(dateRange), [dateRange]);
  const createRepairFn = useCallback((data) => transactionsAPI.recordRepair(data), []);
  const updateRepairFn = useCallback((id, data) => transactionsAPI.updateRepair(id, data), []);
  const fetchLaborCosts = useCallback(() => transactionsAPI.getLaborCosts(dateRange), [dateRange]);
  const fetchLunchAllowances = useCallback(() => transactionsAPI.getLunchAllowanceCosts(dateRange), [dateRange]);

  // Data management for repairs
  const repairsManager = useDataManager({
    fetchFn: fetchRepairs,
    createFn: createRepairFn,
    updateFn: updateRepairFn,
    entityName: 'repair'
  });

  // Data management for labor costs
  const laborManager = useDataManager({
    fetchFn: fetchLaborCosts,
    entityName: 'labor cost'
  });

  // Data management for lunch allowances
  const createLunchAllowanceFn = useCallback((data) => lunchAllowanceAPI.generate(data), []);
  const lunchAllowanceManager = useDataManager({
    fetchFn: fetchLunchAllowances,
    createFn: createLunchAllowanceFn,
    entityName: 'lunch allowance'
  });

  const {
    data: repairs,
    loading: repairsLoading,
    createItem: createRepair,
    updateItem: updateRepair,
    refresh: loadRepairs
  } = repairsManager;

  const {
    data: laborCosts,
    loading: laborLoading,
    refresh: loadLaborCosts
  } = laborManager;

  const {
    data: lunchAllowances,
    loading: lunchAllowanceLoading,
    createItem: createLunchAllowance,
    refresh: loadLunchAllowances
  } = lunchAllowanceManager;

  // Form management for purchases
  const purchaseForm = useFormManager({
    initialData: {
      productId: '',
      quantity: '',
      unitCost: '',
      supplier: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      description: ''
    },
    validationRules: {
      productId: { required: true },
      quantity: { required: true, min: 1 },
      unitCost: { required: true, min: 0 },
      supplier: { required: true },
      purchaseDate: { required: true }
    },
    onSubmit: async (formData) => {
      const purchaseData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        unitCost: parseFloat(formData.unitCost)
      };
      await createPurchase(purchaseData);
      handleClosePurchaseModal();
    }
  });

  // Form management for repairs
  const repairForm = useFormManager({
    initialData: {
      productId: '',
      description: '',
      cost: '',
      repairDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      technician: ''
    },
    validationRules: {
      productId: { required: true },
      description: { required: true },
      cost: { required: true, min: 0 },
      repairDate: { required: true },
      status: { required: true }
    },
    onSubmit: async (formData) => {
      const repairData = {
        ...formData,
        cost: parseFloat(formData.cost)
      };
      
      if (editingRepair) {
        await updateRepair(editingRepair._id, repairData);
      } else {
        await createRepair(repairData);
      }
      
      handleCloseRepairModal();
    }
  });

  // Form management for lunch allowances
  const lunchAllowanceForm = useFormManager({
    initialData: {
      workerId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      notes: ''
    },
    validationRules: {
      workerId: { required: true },
      amount: { required: true, min: 0 },
      date: { required: true },
      status: { required: true }
    },
    onSubmit: async (formData) => {
      const lunchAllowanceData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      
      await createLunchAllowance(lunchAllowanceData);
      handleCloseLunchAllowanceModal();
    }
  });

  const loading = purchasesLoading || repairsLoading || lunchAllowanceLoading;

  useEffect(() => {
    console.log('TransactionsPage useEffect running - loading supporting data...');
    loadSupportingData();
  }, []);

  // Reload data when date range changes
  useEffect(() => {
    loadPurchases();
    loadRepairs();
    loadLaborCosts();
    loadLunchAllowances();
    loadTransactionSummary();
  }, [dateRange, loadPurchases, loadRepairs, loadLaborCosts, loadLunchAllowances]);

  const loadSupportingData = async () => {
    try {
      console.log('Loading products and workers for transactions...');
      const [productsRes, workersRes] = await Promise.all([
        inventoryAPI.products.get(),
        workersAPI.workers.get()
      ]);
      
      console.log('Raw products response:', productsRes);
      console.log('Raw workers response:', workersRes);
      
      // Use the same pattern as useDataManager
      const productsData = productsRes?.data || productsRes || [];
      const workersData = workersRes?.data || workersRes || [];
      
      console.log('Extracted products data:', productsData);
      console.log('Extracted workers data:', workersData);
      
      setProducts(Array.isArray(productsData) ? productsData : []);
      setWorkers(Array.isArray(workersData) ? workersData : []);
    } catch (error) {
      console.error('Error loading supporting data:', error);
      toast.error('Failed to load supporting data');
      setProducts([]);
      setWorkers([]);
    }
  };

  const loadTransactionSummary = async () => {
    try {
      const summaryRes = await transactionsAPI.getTransactionSummary(dateRange);
      setSummary(summaryRes.data || {});
    } catch (error) {
      console.error('Error loading summary:', error);
      setSummary({});
    }
  };

  // Modal handlers
  const handleAddPurchase = () => {
    purchaseForm.reset();
    setShowAddPurchase(true);
  };

  const handleClosePurchaseModal = () => {
    setShowAddPurchase(false);
    purchaseForm.reset();
  };

  const handleAddRepair = () => {
    setEditingRepair(null);
    repairForm.reset();
    setShowAddRepair(true);
  };

  const handleEditRepair = (repair) => {
    setEditingRepair(repair);
    repairForm.setFormData({
      productId: repair.productId || '',
      description: repair.description || '',
      cost: repair.cost || '',
      repairDate: repair.repairDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: repair.status || 'Pending',
      technician: repair.technician || ''
    });
    setShowAddRepair(true);
  };

  const handleCloseRepairModal = () => {
    setShowAddRepair(false);
    setEditingRepair(null);
    repairForm.reset();
  };

  // Lunch allowance handlers
  const handleAddLunchAllowance = () => {
    lunchAllowanceForm.reset();
    setShowAddLunchAllowance(true);
  };

  const handleCloseLunchAllowanceModal = () => {
    setShowAddLunchAllowance(false);
    lunchAllowanceForm.reset();
  };

  const handleEditLunchAllowance = async (allowance) => {
    try {
      // Simple prompt-based editing for now
      const newAmount = prompt(`Edit lunch allowance amount for ${allowance.workerId?.name || 'Worker'} on ${new Date(allowance.date).toLocaleDateString()}:`, allowance.amount);
      
      if (newAmount !== null && !isNaN(parseFloat(newAmount))) {
        const updatedAmount = parseFloat(newAmount);
        if (updatedAmount >= 0) {
          await lunchAllowanceAPI.update(allowance._id, {
            ...allowance,
            amount: updatedAmount
          });
          toast.success('Lunch allowance updated successfully');
          loadLunchAllowances();
        } else {
          toast.error('Amount must be a positive number');
        }
      }
    } catch (error) {
      console.error('Error updating lunch allowance:', error);
      toast.error('Failed to update lunch allowance');
    }
  };

  const handleDeleteLunchAllowance = async (allowance) => {
    if (window.confirm(`Are you sure you want to delete the lunch allowance for ${allowance.workerId?.name || 'Worker'} on ${new Date(allowance.date).toLocaleDateString()}?`)) {
      try {
        await lunchAllowanceAPI.delete(allowance._id);
        toast.success('Lunch allowance deleted successfully');
        loadLunchAllowances();
      } catch (error) {
        console.error('Error deleting lunch allowance:', error);
        toast.error('Failed to delete lunch allowance');
      }
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
    // Refresh data with current date range
    purchasesManager.refresh();
    repairsManager.refresh();
    toast.success('Date filter applied');
  };

  // Get product options for forms
  const productOptions = products.map(product => ({
    value: product._id,
    label: product.name
  }));

  // Get worker options for lunch allowance forms
  const workerOptions = workers.map(worker => ({
    value: worker._id,
    label: worker.name
  }));

  // Lunch allowance status options
  const lunchAllowanceStatusOptions = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Provided', label: 'Provided' },
    { value: 'Cancelled', label: 'Cancelled' }
  ];
  
  console.log('Products state:', products);
  console.log('Product options for dropdown:', productOptions);
  console.log('Workers state:', workers);
  console.log('Worker options for dropdown:', workerOptions);

  // Define purchase table columns
  const purchaseColumns = [
    {
      header: 'Product',
      accessor: 'productId',
      render: (purchase) => getProductName(purchase.productId)
    },
    {
      header: 'Quantity',
      accessor: 'quantity'
    },
    {
      header: 'Unit Cost',
      accessor: 'unitCost',
      type: 'currency'
    },
    {
      header: 'Total Cost',
      accessor: 'totalCost',
      render: (purchase) => `Ksh ${((purchase.quantity || 0) * (purchase.unitCost || 0)).toLocaleString()}`
    },
    {
      header: 'Supplier',
      accessor: 'supplier'
    },
    {
      header: 'Purchase Date',
      accessor: 'purchaseDate',
      type: 'date'
    }
  ];

  // Define repair table columns
  const repairColumns = [
    {
      header: 'Product',
      accessor: 'productId',
    },
    {
      header: 'Description',
      accessor: 'description'
    },
    {
      header: 'Cost',
      accessor: 'cost',
      type: 'currency'
    },
    {
      header: 'Status',
      accessor: 'status',
      type: 'badge',
      getBadgeVariant: getStatusBadgeVariant
    },
    {
      header: 'Technician',
      accessor: 'technician'
    },
    {
      header: 'Repair Date',
      accessor: 'repairDate',
      type: 'date'
    }
  ];

  const laborColumns = [
    {
      header: 'Task',
      accessor: 'taskRate.taskName'
    },
    {
      header: 'Task Type',
      accessor: 'taskRate.taskType'
    },
    {
      header: 'Order',
      accessor: 'order.orderNumber'
    },
    {
      header: 'Quantity',
      accessor: 'quantityCompleted'
    },
    {
      header: 'Rate/Unit',
      accessor: 'taskRate.ratePerUnit',
      type: 'currency'
    },
    {
      header: 'Total Payment',
      accessor: 'totalPayment',
      type: 'currency'
    },
    {
      header: 'Workers',
      accessor: 'workersPresent',
      render: (workers) => workers?.map(w => w.name).join(', ') || 'N/A'
    },
    {
      header: 'Completed Date',
      accessor: 'completedDate',
      type: 'date'
    }
  ];

  const lunchAllowanceColumns = [
    {
      header: 'Worker',
      accessor: 'workerId.name'
    },
    {
      header: 'Date',
      accessor: 'date',
      type: 'date'
    },
    {
      header: 'Amount',
      accessor: 'amount',
      type: 'currency'
    },
    {
      header: 'Status',
      accessor: 'status',
      type: 'badge',
      getBadgeVariant: (status) => status === 'Provided' ? 'default' : 'secondary'
    },
    {
      header: 'Hours Worked',
      accessor: 'attendanceId.hoursWorked',
      render: (hours) => `${hours || 0}h`
    },
    {
      header: 'Task Description',
      accessor: 'attendanceId.taskDescription'
    }
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  KES {summary.purchases?.totalCost?.toLocaleString() || '0'}
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
                  KES {summary.repairs?.totalCost?.toLocaleString() || '0'}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Labor Cost</p>
                <p className="text-2xl font-bold text-purple-600">
                  KES {summary.labor?.totalCost?.toLocaleString() || '0'}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lunch Allowances</p>
                <p className="text-2xl font-bold text-amber-600">
                  KES {summary.lunchAllowances?.totalCost?.toLocaleString() || '0'}
                </p>
              </div>
              <Coffee className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  KES {summary.summary?.totalExpenses?.toLocaleString() || '0'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-900" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Purchases ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="repairs" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Repairs ({repairs.length})
          </TabsTrigger>
          <TabsTrigger value="labor" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Labor ({laborCosts.length})
          </TabsTrigger>
          <TabsTrigger value="lunch" className="flex items-center gap-2">
            <Coffee className="h-4 w-4" />
            Lunch Allowances ({lunchAllowances.length})
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases" className="space-y-4">
          <DataTable
            title="Purchase Records"
            description="Track inventory purchases and costs"
            columns={purchaseColumns}
            data={purchases}
            onAdd={handleAddPurchase}
            addLabel="Record Purchase"
            searchable={true}
            searchPlaceholder="Search purchases by product, supplier..."
            loading={purchasesLoading}
            emptyMessage="No purchases recorded. Start by recording your first purchase."
            emptyIcon={ShoppingCart}
          />
        </TabsContent>

        <TabsContent value="repairs" className="space-y-4">
          <DataTable
            title="Repair Records"
            description="Track equipment repairs and maintenance"
            columns={repairColumns}
            data={repairs}
            onAdd={handleAddRepair}
            addLabel="Record Repair"
            onEdit={handleEditRepair}
            searchable={true}
            searchPlaceholder="Search repairs by product, technician, description..."
            loading={repairsLoading}
            emptyMessage="No repairs recorded. Start by recording your first repair."
            emptyIcon={Wrench}
          />
        </TabsContent>

        <TabsContent value="labor" className="space-y-4">
          <DataTable
            title="Labor Cost Records"
            description="Track worker task completions and labor costs"
            columns={laborColumns}
            data={laborCosts}
            searchable={true}
            searchPlaceholder="Search by task, worker, order..."
            loading={laborLoading}
            emptyMessage="No labor costs recorded. Complete tasks in Task Management to see costs here."
            emptyIcon={Users}
          />
        </TabsContent>

        <TabsContent value="lunch" className="space-y-4">
          <DataTable
            title="Lunch Allowance Records"
            description="Track daily lunch allowances for workers"
            columns={lunchAllowanceColumns}
            data={lunchAllowances}
            onAdd={handleAddLunchAllowance}
            addLabel="Add Lunch Allowance"
            onEdit={handleEditLunchAllowance}
            onDelete={handleDeleteLunchAllowance}
            searchable={true}
            searchPlaceholder="Search by worker, date, status..."
            loading={lunchAllowanceLoading}
            emptyMessage="No lunch allowances recorded. Mark workers as present to generate allowances."
            emptyIcon={Coffee}
          />
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        KES {summary.purchases?.totalCost?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Average Cost</p>
                      <p className="text-2xl font-bold text-purple-600">
                        KES {summary.averagePurchaseCost?.toLocaleString() || '0'}
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
                        KES {summary.repairs?.totalCost?.toLocaleString() || '0'}
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
            <Card>
              <CardHeader>
                <CardTitle>Lunch Allowance Summary</CardTitle>
                <CardDescription>
                  Overview of worker lunch allowances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total Allowances</p>
                      <p className="text-2xl font-bold text-amber-600">{lunchAllowances.length}</p>
                    </div>
                    <Coffee className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total Cost</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        KES {summary.lunchAllowances?.totalCost?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Provided</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Array.isArray(lunchAllowances) ? lunchAllowances.filter(l => l.status === 'Provided').length : 0}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Purchase Form Modal */}
      <FormModal
        isOpen={showAddPurchase}
        onOpenChange={(open) => !open && handleClosePurchaseModal()}
        title="Record New Purchase"
        onSubmit={purchaseForm.handleSubmit}
        loading={purchaseForm.isSubmitting}
      >
        <FormSelect
          label="Product"
          name="productId"
          value={purchaseForm.values.productId || ''}
          onChange={(e) => purchaseForm.handleChange('productId', e.target.value)}
          error={purchaseForm.errors.productId}
          required
          options={productOptions}
          placeholder="Select product"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Quantity"
            name="quantity"
            type="number"
            value={purchaseForm.values.quantity || ''}
            onChange={(e) => purchaseForm.handleChange('quantity', e.target.value)}
            error={purchaseForm.errors.quantity}
            required
            min="1"
            placeholder="1"
          />
          
          <FormInput
            label="Unit Cost (Ksh)"
            name="unitCost"
            type="number"
            value={purchaseForm.values.unitCost || ''}
            onChange={(e) => purchaseForm.handleChange('unitCost', e.target.value)}
            error={purchaseForm.errors.unitCost}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
        
        <FormInput
          label="Supplier"
          name="supplier"
          value={purchaseForm.values.supplier || ''}
          onChange={(e) => purchaseForm.handleChange('supplier', e.target.value)}
          error={purchaseForm.errors.supplier}
          required
          placeholder="Supplier name"
        />
        
        <FormInput
          label="Purchase Date"
          name="purchaseDate"
          type="date"
          value={purchaseForm.values.purchaseDate || ''}
          onChange={(e) => purchaseForm.handleChange('purchaseDate', e.target.value)}
          error={purchaseForm.errors.purchaseDate}
          required
        />
        
        <FormTextarea
          label="Description"
          name="description"
          value={purchaseForm.values.description || ''}
          onChange={(e) => purchaseForm.handleChange('description', e.target.value)}
          error={purchaseForm.errors.description}
          placeholder="Additional details about the purchase..."
          rows={3}
        />
      </FormModal>

      {/* Repair Form Modal */}
      <FormModal
        isOpen={showAddRepair}
        onOpenChange={(open) => !open && handleCloseRepairModal()}
        title={editingRepair ? 'Edit Repair' : 'Record New Repair'}
        onSubmit={repairForm.handleSubmit}
        loading={repairForm.isSubmitting}
      >
        <FormSelect
          label="Product"
          name="productId"
          value={repairForm.values.productId || ''}
          onChange={(e) => repairForm.handleChange('productId', e.target.value)}
          error={repairForm.errors.productId}
          required
          options={productOptions}
          placeholder="Select product"
        />
        
        <FormTextarea
          label="Description"
          name="description"
          value={repairForm.values.description || ''}
          onChange={(e) => repairForm.handleChange('description', e.target.value)}
          error={repairForm.errors.description}
          required
          placeholder="Describe the repair work needed..."
          rows={3}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Repair Cost (Ksh)"
            name="cost"
            type="number"
            value={repairForm.values.cost || ''}
            onChange={(e) => repairForm.handleChange('cost', e.target.value)}
            error={repairForm.errors.cost}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
          />
          
          <FormInput
            label="Repair Date"
            name="repairDate"
            type="date"
            value={repairForm.values.repairDate || ''}
            onChange={(e) => repairForm.handleChange('repairDate', e.target.value)}
            error={repairForm.errors.repairDate}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Status"
            name="status"
            value={repairForm.values.status || 'Pending'}
            onChange={(e) => repairForm.handleChange('status', e.target.value)}
            error={repairForm.errors.status}
            required
            options={repairStatusOptions}
          />
          
          <FormInput
            label="Technician"
            name="technician"
            value={repairForm.values.technician || ''}
            onChange={(e) => repairForm.handleChange('technician', e.target.value)}
            error={repairForm.errors.technician}
            placeholder="Technician name"
          />
        </div>
      </FormModal>

      {/* Lunch Allowance Form Modal */}
      <FormModal
        isOpen={showAddLunchAllowance}
        onOpenChange={(open) => !open && handleCloseLunchAllowanceModal()}
        title="Add Lunch Allowance"
        onSubmit={lunchAllowanceForm.handleSubmit}
        loading={lunchAllowanceForm.isSubmitting}
      >
        <FormSelect
          label="Worker"
          name="workerId"
          value={lunchAllowanceForm.values.workerId || ''}
          onChange={(e) => lunchAllowanceForm.handleChange('workerId', e.target.value)}
          error={lunchAllowanceForm.errors.workerId}
          required
          options={workerOptions}
          placeholder="Select worker"
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Amount (KES)"
            name="amount"
            type="number"
            value={lunchAllowanceForm.values.amount || ''}
            onChange={(e) => lunchAllowanceForm.handleChange('amount', e.target.value)}
            error={lunchAllowanceForm.errors.amount}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
          />
          
          <FormInput
            label="Date"
            name="date"
            type="date"
            value={lunchAllowanceForm.values.date || ''}
            onChange={(e) => lunchAllowanceForm.handleChange('date', e.target.value)}
            error={lunchAllowanceForm.errors.date}
            required
          />
        </div>
        
        <FormSelect
          label="Status"
          name="status"
          value={lunchAllowanceForm.values.status || 'Pending'}
          onChange={(e) => lunchAllowanceForm.handleChange('status', e.target.value)}
          error={lunchAllowanceForm.errors.status}
          required
          options={lunchAllowanceStatusOptions}
        />
        
        <FormTextarea
          label="Notes"
          name="notes"
          value={lunchAllowanceForm.values.notes || ''}
          onChange={(e) => lunchAllowanceForm.handleChange('notes', e.target.value)}
          error={lunchAllowanceForm.errors.notes}
          placeholder="Additional notes about the lunch allowance..."
          rows={3}
        />
      </FormModal>
    </div>
  );
};

export default TransactionsPage;