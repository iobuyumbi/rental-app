import React, { useState, useEffect, useCallback } from 'react';
import { transactionsAPI, inventoryAPI, workersAPI, lunchAllowanceAPI } from '../services/api';
import { toast } from 'sonner';
import { useDataManager } from '../hooks/useDataManager';
import { useFormManager } from '../hooks/useFormManager';

// Import our new components
import TransactionSummaryCards from '../components/transactions/TransactionSummaryCards';
import TransactionTabs from '../components/transactions/TransactionTabs';
import PurchaseForm from '../components/transactions/PurchaseForm';
import RepairForm from '../components/transactions/RepairForm';
import LunchAllowanceForm from '../components/transactions/LunchAllowanceForm';
import DateRangeFilter from '../components/transactions/DateRangeFilter';

const TransactionsPage = () => {
  const [products, setProducts] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [summary, setSummary] = useState({});
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [showAddRepair, setShowAddRepair] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [showAddLunchAllowance, setShowAddLunchAllowance] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Create stable functions to prevent infinite re-renders
  const fetchPurchases = useCallback(() => transactionsAPI.getPurchases(dateRange), [dateRange]);
  const createPurchaseFn = useCallback((data) => transactionsAPI.recordPurchase(data), []);
  const fetchRepairs = useCallback(() => transactionsAPI.getRepairs(dateRange), [dateRange]);
  const createRepairFn = useCallback((data) => transactionsAPI.recordRepair(data), []);
  const updateRepairFn = useCallback((id, data) => transactionsAPI.updateRepair(id, data), []);
  const fetchLaborCosts = useCallback(() => transactionsAPI.getLaborCosts(dateRange), [dateRange]);
  const fetchLunchAllowances = useCallback(() => transactionsAPI.getLunchAllowanceCosts(dateRange), [dateRange]);
  const createLunchAllowanceFn = useCallback((data) => lunchAllowanceAPI.generate(data), []);

  // Data management for purchases
  const purchasesManager = useDataManager({
    fetchFn: fetchPurchases,
    createFn: createPurchaseFn,
    entityName: 'purchase'
  });

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
  const lunchAllowanceManager = useDataManager({
    fetchFn: fetchLunchAllowances,
    createFn: createLunchAllowanceFn,
    entityName: 'lunch allowance'
  });

  const {
    data: purchases,
    loading: purchasesLoading,
    createItem: createPurchase,
    refresh: loadPurchases
  } = purchasesManager;

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

  const loading = {
    purchases: purchasesLoading,
    repairs: repairsLoading,
    labor: laborLoading,
    lunchAllowance: lunchAllowanceLoading
  };

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

  console.log('Products state:', products);
  console.log('Product options for dropdown:', productOptions);
  console.log('Workers state:', workers);
  console.log('Worker options for dropdown:', workerOptions);

  if (loading.purchases || loading.repairs || loading.lunchAllowance) {
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
          <DateRangeFilter 
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onApplyFilter={applyDateFilter}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <TransactionSummaryCards 
        summary={summary}
        purchases={purchases}
        repairs={repairs}
        lunchAllowances={lunchAllowances}
      />

      {/* Transaction Tabs */}
      <TransactionTabs
        purchases={purchases}
        repairs={repairs}
        laborCosts={laborCosts}
        lunchAllowances={lunchAllowances}
        summary={summary}
        loading={loading}
        onAddPurchase={handleAddPurchase}
        onAddRepair={handleAddRepair}
        onEditRepair={handleEditRepair}
        onAddLunchAllowance={handleAddLunchAllowance}
        onEditLunchAllowance={handleEditLunchAllowance}
        onDeleteLunchAllowance={handleDeleteLunchAllowance}
        getProductName={getProductName}
      />

      {/* Forms */}
      <PurchaseForm
        isOpen={showAddPurchase}
        onClose={handleClosePurchaseModal}
        onSubmit={purchaseForm.handleSubmit}
        formData={purchaseForm.values}
        onFormChange={purchaseForm.handleChange}
        errors={purchaseForm.errors}
        isSubmitting={purchaseForm.isSubmitting}
        productOptions={productOptions}
      />

      <RepairForm
        isOpen={showAddRepair}
        onClose={handleCloseRepairModal}
        onSubmit={repairForm.handleSubmit}
        formData={repairForm.values}
        onFormChange={repairForm.handleChange}
        errors={repairForm.errors}
        isSubmitting={repairForm.isSubmitting}
        productOptions={productOptions}
        editingRepair={editingRepair}
      />

      <LunchAllowanceForm
        isOpen={showAddLunchAllowance}
        onClose={handleCloseLunchAllowanceModal}
        onSubmit={lunchAllowanceForm.handleSubmit}
        formData={lunchAllowanceForm.values}
        onFormChange={lunchAllowanceForm.handleChange}
        errors={lunchAllowanceForm.errors}
        isSubmitting={lunchAllowanceForm.isSubmitting}
        workerOptions={workerOptions}
      />
    </div>
  );
};

export default TransactionsPage;
