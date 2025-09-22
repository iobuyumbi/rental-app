import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent } from '../ui/card';
import { AlertTriangle, DollarSign, CheckCircle, Clock } from 'lucide-react';

const ResolveViolationDialog = ({
  isOpen,
  onClose,
  violation,
  onResolve,
  loading = false,
  isBulkResolve = false,
  violationCount = 1
}) => {
  const [resolutionData, setResolutionData] = useState({
    resolutionType: 'full_payment',
    paidAmount: violation?.penaltyAmount || 0,
    waiveAmount: 0,
    resolutionNotes: '',
    paymentMethod: 'cash',
    receiptNumber: '',
    notifyClient: true
  });

  const handleInputChange = (field, value) => {
    setResolutionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onResolve(resolutionData);
  };

  const calculateTotalAmount = () => {
    const paid = parseFloat(resolutionData.paidAmount) || 0;
    const waived = parseFloat(resolutionData.waiveAmount) || 0;
    return paid + waived;
  };

  const getRemainingAmount = () => {
    const penalty = violation?.penaltyAmount || 0;
    const total = calculateTotalAmount();
    return Math.max(0, penalty - total);
  };

  const resolutionTypes = [
    { value: 'full_payment', label: 'Full Payment' },
    { value: 'partial_payment', label: 'Partial Payment' },
    { value: 'waived', label: 'Penalty Waived' },
    { value: 'partial_waived', label: 'Partial Payment + Waived' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'mpesa', label: 'M-Pesa' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'card', label: 'Card Payment' }
  ];

  if (isBulkResolve) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resolve Multiple Violations
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to resolve {violationCount} selected violations?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    This action will mark all selected violations as resolved.
                    Individual payment details will need to be updated separately.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="bulkNotes">Resolution Notes</Label>
              <Textarea
                id="bulkNotes"
                placeholder="Add notes for bulk resolution..."
                value={resolutionData.resolutionNotes}
                onChange={(e) => handleInputChange('resolutionNotes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyClients"
                checked={resolutionData.notifyClient}
                onCheckedChange={(checked) => handleInputChange('notifyClient', checked)}
              />
              <Label htmlFor="notifyClients" className="text-sm">
                Notify affected clients
              </Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Resolving...' : `Resolve ${violationCount} Violations`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Resolve Violation
          </DialogTitle>
          <DialogDescription>
            Process the resolution of this violation and update payment details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Violation Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Order ID</Label>
                  <p className="font-medium">#{violation?.order?._id?.slice(-8) || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Client</Label>
                  <p className="font-medium">{violation?.order?.client?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Violation Type</Label>
                  <Badge variant="outline" className="mt-1">
                    {violation?.violationType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Penalty Amount</Label>
                  <p className="font-medium text-red-600 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    KES {violation?.penaltyAmount?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resolutionType">Resolution Type</Label>
              <Select
                value={resolutionData.resolutionType}
                onValueChange={(value) => handleInputChange('resolutionType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resolutionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={resolutionData.paymentMethod}
                onValueChange={(value) => handleInputChange('paymentMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paidAmount">Amount Paid</Label>
              <Input
                id="paidAmount"
                type="number"
                min="0"
                max={violation?.penaltyAmount}
                value={resolutionData.paidAmount}
                onChange={(e) => handleInputChange('paidAmount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="waiveAmount">Amount Waived</Label>
              <Input
                id="waiveAmount"
                type="number"
                min="0"
                value={resolutionData.waiveAmount}
                onChange={(e) => handleInputChange('waiveAmount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Receipt Number */}
          <div>
            <Label htmlFor="receiptNumber">Receipt/Reference Number</Label>
            <Input
              id="receiptNumber"
              value={resolutionData.receiptNumber}
              onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
              placeholder="Enter receipt or reference number"
            />
          </div>

          {/* Payment Summary */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Original Penalty:</span>
                  <span className="font-medium">KES {violation?.penaltyAmount?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Amount Paid:</span>
                  <span className="text-green-600">KES {resolutionData.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Amount Waived:</span>
                  <span className="text-blue-600">KES {resolutionData.waiveAmount.toLocaleString()}</span>
                </div>
                <hr />
                <div className="flex justify-between font-medium">
                  <span>Remaining Balance:</span>
                  <span className={getRemainingAmount() > 0 ? 'text-red-600' : 'text-green-600'}>
                    KES {getRemainingAmount().toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Notes */}
          <div>
            <Label htmlFor="resolutionNotes">Resolution Notes</Label>
            <Textarea
              id="resolutionNotes"
              value={resolutionData.resolutionNotes}
              onChange={(e) => handleInputChange('resolutionNotes', e.target.value)}
              placeholder="Add any notes about the resolution..."
              rows={3}
            />
          </div>

          {/* Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="notifyClient"
              checked={resolutionData.notifyClient}
              onCheckedChange={(checked) => handleInputChange('notifyClient', checked)}
            />
            <Label htmlFor="notifyClient" className="text-sm">
              Send resolution notification to client
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading || getRemainingAmount() > 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Processing...' : 'Resolve Violation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ResolveViolationDialog;
