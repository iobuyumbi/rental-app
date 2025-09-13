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
import { 
  FileText, 
  Download, 
  Receipt, 
  FileBarChart, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  Users,
  Clock,
  Eye,
  CheckCircle
} from 'lucide-react';
import { reportsAPI, ordersAPI } from '../services/api';
import { toast } from 'sonner';

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
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice generated successfully');
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
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt generated successfully');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (reportType, format = 'csv') => {
    try {
      setLoading(true);
      const response = await reportsAPI.export(reportType, format, dateRange);
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${reportType} report exported successfully`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

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

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generate Invoice
                </CardTitle>
                <CardDescription>
                  Generate PDF invoices for completed orders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="invoiceOrder">Select Order</Label>
                  <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(orders) && orders.map(order => (
                        <SelectItem key={order._id} value={order._id}>
                          Order #{order.orderNumber} - {order.clientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => generateInvoice(selectedOrder)}
                  disabled={!selectedOrder || loading}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Invoice
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Generate Receipt
                </CardTitle>
                <CardDescription>
                  Generate payment receipts for orders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="receiptOrder">Select Order</Label>
                  <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(orders) && orders.filter(order => order.paymentStatus === 'Paid').map(order => (
                        <SelectItem key={order._id} value={order._id}>
                          Order #{order.orderNumber} - {order.clientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => generateReceipt(selectedOrder)}
                  disabled={!selectedOrder || loading}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Receipt
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue Returns</p>
                    <p className="text-2xl font-bold text-red-600">{reports.overdueReturns.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Discount Approvals</p>
                    <p className="text-2xl font-bold">{reports.discountApprovals.length}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Casual Workers</p>
                    <p className="text-2xl font-bold">{reports.casualRemuneration.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Overdue Returns</CardTitle>
              <CardDescription>
                Orders that are past their return date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.overdueReturns.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-gray-600">No overdue returns</p>
                  <p className="text-sm text-gray-500">All orders are returned on time</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(reports.overdueReturns) && reports.overdueReturns.map((order) => {
                      const daysOverdue = Math.floor((new Date() - new Date(order.returnDate)) / (1000 * 60 * 60 * 24));
                      return (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                          <TableCell>{order.clientName}</TableCell>
                          <TableCell>{new Date(order.returnDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="destructive">{daysOverdue} days</Badge>
                          </TableCell>
                          <TableCell>KSH {order.totalAmount?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status Report</CardTitle>
              <CardDescription>
                Current inventory levels and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {reports.inventoryStatus.totalProducts || 0}
                      </p>
                      <p className="text-sm text-gray-600">Total Products</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {reports.inventoryStatus.availableProducts || 0}
                      </p>
                      <p className="text-sm text-gray-600">Available</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {reports.inventoryStatus.rentedProducts || 0}
                      </p>
                      <p className="text-sm text-gray-600">Currently Rented</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => exportReport('inventory-status', 'csv')} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Inventory Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Discount Approvals</CardTitle>
                <CardDescription>
                  Recent discount requests and approvals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.discountApprovals.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No discount approvals</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(reports.discountApprovals) && reports.discountApprovals.slice(0, 5).map((discount, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Order #{discount.orderNumber}</p>
                          <p className="text-sm text-gray-600">{discount.clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {discount.discountPercentage}% off
                          </p>
                          <p className="text-sm text-gray-600">
                            KSH {discount.discountAmount?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button 
                      onClick={() => exportReport('discount-approvals', 'csv')} 
                      disabled={loading}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Full Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Casual Worker Remuneration</CardTitle>
                <CardDescription>
                  Worker payment summary for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.casualRemuneration.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No remuneration data</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(reports.casualRemuneration) && reports.casualRemuneration.slice(0, 5).map((worker, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{worker.name}</p>
                          <p className="text-sm text-gray-600">
                            {worker.totalHours}h worked
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            KSH {worker.totalAmount?.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {worker.daysWorked} days
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button 
                      onClick={() => exportReport('casual-remuneration', 'csv')} 
                      disabled={loading}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Full Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;