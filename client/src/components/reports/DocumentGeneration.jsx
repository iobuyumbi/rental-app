import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FileText, Receipt, Download } from 'lucide-react';

const DocumentGeneration = ({ 
  orders, 
  selectedOrder, 
  setSelectedOrder, 
  onGenerateInvoice, 
  onGenerateReceipt, 
  loading 
}) => {
  return (
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
            onClick={() => onGenerateInvoice(selectedOrder)}
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
            onClick={() => onGenerateReceipt(selectedOrder)}
            disabled={!selectedOrder || loading}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Generate Receipt
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentGeneration;
