import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  FileText, 
  Download, 
  Mail, 
  Eye, 
  Printer,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { invoiceAPI } from '../../services/invoiceAPI';
import { toast } from 'sonner';

const InvoiceManager = ({ order, onClose }) => {
  const [generating, setGenerating] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const handleGenerateInvoice = async () => {
    try {
      setGenerating(true);
      const data = await invoiceAPI.generateInvoice(order._id);
      setInvoiceData(data);
      toast.success('Invoice generated successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdf = await invoiceAPI.generatePDFInvoice(order._id);
      pdf.save(`invoice-${order._id?.slice(-8)}.pdf`);
      toast.success('Invoice downloaded');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handlePreviewPDF = async () => {
    try {
      const pdf = await invoiceAPI.generatePDFInvoice(order._id);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error previewing invoice:', error);
      toast.error('Failed to preview invoice');
    }
  };

  const handlePrint = async () => {
    try {
      const pdf = await invoiceAPI.generatePDFInvoice(order._id);
      pdf.autoPrint();
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error('Failed to print invoice');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-gray-600">Order #{order._id?.slice(-8)}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Order Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Client Information</h4>
              <div className="space-y-1 text-sm">
                <div>{order.client?.name || 'N/A'}</div>
                <div className="text-gray-600">{order.client?.email || 'N/A'}</div>
                <div className="text-gray-600">{order.client?.phone || 'N/A'}</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Rental Period</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(order.rentalStartDate).toLocaleDateString()} - {new Date(order.rentalEndDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  KES {order.totalAmount?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Actions
          </CardTitle>
          <CardDescription>
            Generate and manage invoices for this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={handleGenerateInvoice}
              disabled={generating}
              className="h-20 flex-col gap-2"
            >
              <FileText className="h-6 w-6" />
              {generating ? 'Generating...' : 'Generate Invoice'}
            </Button>

            <Button 
              variant="outline"
              onClick={handleDownloadPDF}
              className="h-20 flex-col gap-2"
            >
              <Download className="h-6 w-6" />
              Download PDF
            </Button>

            <Button 
              variant="outline"
              onClick={handlePreviewPDF}
              className="h-20 flex-col gap-2"
            >
              <Eye className="h-6 w-6" />
              Preview
            </Button>

            <Button 
              variant="outline"
              onClick={handlePrint}
              className="h-20 flex-col gap-2"
            >
              <Printer className="h-6 w-6" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      {invoiceData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Invoice Details</span>
              <Badge className={getStatusColor(invoiceData.status)}>
                {getStatusIcon(invoiceData.status)}
                {invoiceData.status?.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Invoice Information</h4>
                  <div className="space-y-2 text-sm mt-2">
                    <div className="flex justify-between">
                      <span>Invoice Number:</span>
                      <span className="font-mono">{invoiceData.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issue Date:</span>
                      <span>{new Date(invoiceData.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span>{new Date(invoiceData.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Terms:</span>
                      <span>{invoiceData.paymentTerms}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Amount Breakdown</h4>
                  <div className="space-y-2 text-sm mt-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>KES {invoiceData.subtotal?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (16%):</span>
                      <span>KES {invoiceData.tax?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>KES {invoiceData.total?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Invoice Items</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-4 py-2 text-center">Quantity</th>
                      <th className="px-4 py-2 text-right">Unit Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items?.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{item.product?.name || item.name}</td>
                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">KES {item.unitPrice?.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right">KES {item.totalPrice?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Email Invoice
            </Button>
            <Button variant="outline" size="sm">
              Mark as Paid
            </Button>
            <Button variant="outline" size="sm">
              Send Reminder
            </Button>
            <Button variant="outline" size="sm">
              Duplicate Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceManager;
