import { useState, useEffect } from 'react';
import { reportsAPI, ordersAPI } from '../services/api';
import { toast } from 'sonner';

// Import our new components
import DateRangeFilter from '../components/reports/DateRangeFilter';
import ReportsTabs from '../components/reports/ReportsTabs';

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [reports, setReports] = useState({
    discountApprovals: [],
    casualRemuneration: [],
    inventoryStatus: {},
    overdueReturns: []
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [ordersRes] = await Promise.all([
        ordersAPI.getOrders()
      ]);
      setOrders(ordersRes.data?.data || ordersRes.data || []);
      await loadReports();
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const [discountRes, casualRes, inventoryRes, overdueRes] = await Promise.allSettled([
        reportsAPI.discountApprovals(dateRange),
        reportsAPI.casualRemuneration(dateRange),
        reportsAPI.inventoryStatus(),
        reportsAPI.overdueReturns(dateRange)
      ]);

      setReports({
        discountApprovals: discountRes.status === 'fulfilled' ? (discountRes.value.data || []) : [],
        casualRemuneration: casualRes.status === 'fulfilled' ? (casualRes.value.data || []) : [],
        inventoryStatus: inventoryRes.status === 'fulfilled' ? (inventoryRes.value.data || {}) : {},
        overdueReturns: overdueRes.status === 'fulfilled' ? (overdueRes.value.data || []) : []
      });
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load some reports');
    }
  };

  const generateInvoice = async (orderId) => {
    try {
      setLoading(true);
      const response = await reportsAPI.invoices.generate(orderId);
      // Server returns JSON invoice data, not a PDF. Optionally display or handle it here.
      console.debug('Invoice data:', response);
      toast.success('Invoice data generated');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = async (orderId) => {
    try {
      setLoading(true);
      const response = await reportsAPI.receipts.generate(orderId);
      // Server returns JSON receipt data, not a PDF.
      console.debug('Receipt data:', response);
      toast.success('Receipt data generated');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    } finally {
      setLoading(false);
    }
  };

  // Note: Export endpoints are not implemented on the server. Buttons removed for now.

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const applyDateFilter = () => {
    loadReports();
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and view system reports</p>
        </div>
        <div className="flex gap-2">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onApplyFilter={applyDateFilter}
          />
        </div>
      </div>

      <ReportsTabs
        orders={orders}
        reports={reports}
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
        onGenerateInvoice={generateInvoice}
        onGenerateReceipt={generateReceipt}
        loading={loading}
      />
    </div>
  );
};

export default ReportsPage;
