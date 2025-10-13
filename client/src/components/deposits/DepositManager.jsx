import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { 
  DollarSign, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  FileText,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

const DepositManager = ({ order, onDepositUpdate, onClose }) => {
  const [depositData, setDepositData] = useState({
    amount: 0,
    status: 'pending',
    collectedAt: null,
    refundedAt: null,
    deductionAmount: 0,
    deductionReason: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize deposit data from order
    if (order.deposit) {
      setDepositData(order.deposit);
    } else {
      // Calculate suggested deposit amount (20% of order total)
      const suggestedAmount = Math.round(order.totalAmount * 0.2);
      setDepositData(prev => ({
        ...prev,
        amount: suggestedAmount
      }));
    }
  }, [order]);

  const handleCollectDeposit = async () => {
    try {
      setLoading(true);
      
      const updatedDeposit = {
        ...depositData,
        status: 'collected',
        collectedAt: new Date().toISOString()
      };

      await onDepositUpdate(order._id, updatedDeposit);
      setDepositData(updatedDeposit);
      
      toast.success(`Deposit of KES ${depositData.amount.toLocaleString()} collected successfully`);
    } catch (error) {
      toast.error('Failed to collect deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundDeposit = async () => {
    try {
      setLoading(true);
      
      const refundAmount = depositData.amount - (depositData.deductionAmount || 0);
      const updatedDeposit = {
        ...depositData,
        status: refundAmount > 0 ? 'refunded' : 'forfeited',
        refundedAt: new Date().toISOString(),
        refundAmount
      };

      await onDepositUpdate(order._id, updatedDeposit);
      setDepositData(updatedDeposit);
      
      if (refundAmount > 0) {
        toast.success(`Deposit refund of KES ${refundAmount.toLocaleString()} processed`);
      } else {
        toast.info('Deposit forfeited due to deductions');
      }
    } catch (error) {
      toast.error('Failed to process deposit refund');
    } finally {
      setLoading(false);
    }
  };

  const handleDeductionChange = (field, value) => {
    setDepositData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'collected': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'forfeited': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'collected': return <CheckCircle className="h-4 w-4" />;
      case 'refunded': return <RefreshCw className="h-4 w-4" />;
      case 'forfeited': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const canCollect = depositData.status === 'pending' && order.status === 'in_progress';
  const canRefund = depositData.status === 'collected' && order.status === 'completed';
  const refundAmount = depositData.amount - (depositData.deductionAmount || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Deposit Management</h2>
          <p className="text-gray-600">Order #{order._id?.slice(-8)}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Deposit Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Deposit Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                KES {depositData.amount?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Deposit Amount</div>
            </div>
            
            <div className="text-center">
              <Badge className={getStatusColor(depositData.status)}>
                {getStatusIcon(depositData.status)}
                {depositData.status?.toUpperCase()}
              </Badge>
              <div className="text-sm text-gray-600 mt-2">Current Status</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                KES {refundAmount?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Refund Amount</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Actions */}
      {canCollect && (
        <Card>
          <CardHeader>
            <CardTitle>Collect Deposit</CardTitle>
            <CardDescription>
              Collect security deposit when items are issued to customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deposit-amount">Deposit Amount (KES)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    value={depositData.amount}
                    onChange={(e) => handleDeductionChange('amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleCollectDeposit}
                    disabled={loading}
                    className="w-full"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {loading ? 'Collecting...' : 'Collect Deposit'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refund/Deduction Management */}
      {canRefund && (
        <Card>
          <CardHeader>
            <CardTitle>Process Deposit Refund</CardTitle>
            <CardDescription>
              Review items and process deposit refund or deductions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deduction-amount">Deduction Amount (KES)</Label>
                  <Input
                    id="deduction-amount"
                    type="number"
                    value={depositData.deductionAmount || 0}
                    onChange={(e) => handleDeductionChange('deductionAmount', parseFloat(e.target.value) || 0)}
                    placeholder="Enter deduction amount"
                  />
                </div>
                <div>
                  <Label htmlFor="deduction-reason">Deduction Reason</Label>
                  <Input
                    id="deduction-reason"
                    value={depositData.deductionReason || ''}
                    onChange={(e) => handleDeductionChange('deductionReason', e.target.value)}
                    placeholder="e.g., Damage to chair leg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="deposit-notes">Notes</Label>
                <Textarea
                  id="deposit-notes"
                  value={depositData.notes || ''}
                  onChange={(e) => handleDeductionChange('notes', e.target.value)}
                  placeholder="Additional notes about the deposit..."
                  rows={3}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Original Deposit:</span>
                  <span className="font-medium">KES {depositData.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Deductions:</span>
                  <span className="font-medium text-red-600">
                    -KES {(depositData.deductionAmount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t pt-2 mt-2">
                  <span className="font-semibold">Refund Amount:</span>
                  <span className="font-bold text-green-600">
                    KES {refundAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleRefundDeposit}
                disabled={loading}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {loading ? 'Processing...' : `Process Refund (KES ${refundAmount.toLocaleString()})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deposit History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Deposit History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {depositData.collectedAt && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Deposit Collected</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">KES {depositData.amount?.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(depositData.collectedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {depositData.refundedAt && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">
                    {depositData.status === 'forfeited' ? 'Deposit Forfeited' : 'Deposit Refunded'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    KES {(depositData.refundAmount || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(depositData.refundedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {depositData.notes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">Notes:</div>
                <div className="text-sm text-gray-600">{depositData.notes}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositManager;
