import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Calendar, Clock, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * StatusChangeModal - Modal for changing order status with date entry and pricing calculations
 * Handles chargeable days calculation and amount adjustments
 */
const StatusChangeModal = ({ 
  isOpen, 
  order, 
  onStatusChange, 
  onClose 
}) => {
  const [newStatus, setNewStatus] = useState(order.status);
  const [actualDate, setActualDate] = useState('');
  const [chargeableDays, setChargeableDays] = useState(0);
  const [calculations, setCalculations] = useState(null);
  const [loading, setLoading] = useState(false);

  // Status options based on current status
  const getAvailableStatuses = (currentStatus) => {
    const statusFlow = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // Cannot change from completed
      'cancelled': [] // Cannot change from cancelled
    };
    return statusFlow[currentStatus] || [];
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending (Awaiting Confirmation)' },
    { value: 'confirmed', label: 'Confirmed (Ready for Pickup)' },
    { value: 'in_progress', label: 'In Progress (Items Rented Out)' },
    { value: 'completed', label: 'Completed (Items Returned)' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const availableStatuses = getAvailableStatuses(order.status);

  useEffect(() => {
    // Set default date based on status change
    const today = new Date().toISOString().split('T')[0];
    setActualDate(today);
  }, [newStatus]);

  useEffect(() => {
    // Calculate chargeable days and pricing when date or status changes
    if (actualDate && newStatus) {
      calculateChargeableDays();
    }
  }, [actualDate, newStatus, chargeableDays]);

  const calculateChargeableDays = () => {
    try {
      const startDate = new Date(order.rentalStartDate);
      const endDate = new Date(order.rentalEndDate);
      const actualDateObj = new Date(actualDate);
      
      // Calculate planned rental period (includes setup, event, and return)
      const plannedPeriodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      // Default chargeable days should be much less than the full period (typically 1 for event day)
      const defaultChargeableDays = order.defaultChargeableDays || 1;
      let calculatedDays = chargeableDays || defaultChargeableDays;
      let adjustedAmount = order.totalAmount;
      
      // Calculate daily rate based on original chargeable days, not the full period
      let dailyRate = order.totalAmount / defaultChargeableDays;
      
      // Calculate based on status change
      if (newStatus === 'completed') {
        // For completion, calculate actual usage
        const actualUsageDays = Math.ceil((actualDateObj - startDate) / (1000 * 60 * 60 * 24)) + 1;
        calculatedDays = chargeableDays || actualUsageDays;
        
        // Apply pricing rules based on chargeable days vs default
        if (calculatedDays < defaultChargeableDays) {
          // Early return - minimum 50% charge
          const minimumCharge = order.totalAmount * 0.5;
          const calculatedCharge = calculatedDays * dailyRate;
          adjustedAmount = Math.max(minimumCharge, calculatedCharge);
        } else if (calculatedDays > defaultChargeableDays) {
          // Extended usage - charge extra at 150% rate
          const extraDays = calculatedDays - defaultChargeableDays;
          adjustedAmount = order.totalAmount + (extraDays * dailyRate * 1.5);
        } else {
          // Standard usage - original amount
          adjustedAmount = order.totalAmount;
        }
      } else if (newStatus === 'in_progress') {
        // For in-progress, use default chargeable days unless manually overridden
        calculatedDays = chargeableDays || defaultChargeableDays;
        adjustedAmount = calculatedDays * dailyRate;
      }

      setCalculations({
        plannedPeriodDays,
        defaultChargeableDays,
        chargeableDays: calculatedDays,
        dailyRate,
        originalAmount: order.totalAmount,
        adjustedAmount,
        difference: adjustedAmount - order.totalAmount,
        isEarlyReturn: calculatedDays < defaultChargeableDays,
        isLateReturn: calculatedDays > defaultChargeableDays,
        actualDate: actualDate
      });

    } catch (error) {
      console.error('Error calculating chargeable days:', error);
      setCalculations(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const statusData = {
        status: newStatus,
        actualDate,
        chargeableDays: calculations?.chargeableDays || chargeableDays,
        adjustedAmount: calculations?.adjustedAmount || order.totalAmount,
        calculations
      };

      await onStatusChange(statusData);
      toast.success(`Order status changed to ${newStatus}`);
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Failed to change order status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (calculations?.isEarlyReturn) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (calculations?.isLateReturn) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-blue-600" />;
  };

  const getStatusMessage = () => {
    if (!calculations) return '';
    
    if (calculations.isEarlyReturn) {
      return `Reduced usage (${calculations.chargeableDays} of ${calculations.defaultChargeableDays} chargeable days)`;
    } else if (calculations.isLateReturn) {
      return `Extended usage (${calculations.chargeableDays} vs ${calculations.defaultChargeableDays} standard days)`;
    }
    return `Standard usage (${calculations.chargeableDays} chargeable days)`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Change Order Status - #{order._id?.slice(-6).toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            Update the order status and manage rental dates and pricing calculations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* Current Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Current Status</h3>
            <Badge variant="outline">{order.status}</Badge>
            <div className="text-sm text-gray-600 mt-2">
              <div>Rental Period: {new Date(order.rentalStartDate).toLocaleDateString()} - {new Date(order.rentalEndDate).toLocaleDateString()}</div>
              <div>Expected Return: {new Date(order.rentalEndDate).toLocaleDateString()}</div>
              <div>Original Amount: KES {order.totalAmount?.toLocaleString()}</div>
              <div>Default Chargeable Days: {order.defaultChargeableDays || 1}</div>
            </div>
          </div>

          {/* New Status Selection */}
          <div className="space-y-3">
            <Label htmlFor="status">New Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions
                  .filter(option => availableStatuses.includes(option.value))
                  .map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          {/* Date Entry */}
          {(newStatus === 'in_progress' || newStatus === 'completed') && (
            <div className="space-y-3">
              <Label htmlFor="actualDate">
                {newStatus === 'in_progress' ? 'Pickup Date' : 'Return Date'}
              </Label>
              <Input
                id="actualDate"
                type="date"
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
              />
            </div>
          )}

          {/* Chargeable Days */}
          {(newStatus === 'in_progress' || newStatus === 'completed') && (
            <div className="space-y-3">
              <Label htmlFor="chargeableDays">Chargeable Days</Label>
              <Input
                id="chargeableDays"
                type="number"
                min="1"
                value={chargeableDays}
                onChange={(e) => setChargeableDays(parseInt(e.target.value) || 0)}
                placeholder="Enter number of chargeable days"
              />
              <p className="text-sm text-gray-600">
                Leave empty to auto-calculate based on actual usage
              </p>
            </div>
          )}

          {/* Calculations Display */}
          {calculations && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon()}
                <span className="font-medium">{getStatusMessage()}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Rental Period:</div>
                  <div>{calculations.plannedPeriodDays} days (setup + event + return)</div>
                </div>
                <div>
                  <div className="font-medium">Standard Chargeable:</div>
                  <div>{calculations.defaultChargeableDays} days (event only)</div>
                </div>
                <div>
                  <div className="font-medium">Actual Chargeable:</div>
                  <div>{calculations.chargeableDays} days</div>
                </div>
                <div>
                  <div className="font-medium">Rate per Day:</div>
                  <div>KES {calculations.dailyRate?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium">Original Amount:</div>
                  <div>KES {calculations.originalAmount?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="font-medium">Calculation:</div>
                  <div>{calculations.chargeableDays} × KES {calculations.dailyRate?.toLocaleString()}</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-300">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Adjusted Amount:</span>
                  <span className={`font-bold text-lg ${
                    calculations.difference > 0 ? 'text-red-600' : 
                    calculations.difference < 0 ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    KES {calculations.adjustedAmount?.toLocaleString()}
                  </span>
                </div>
                
                {calculations.difference !== 0 && (
                  <div className="text-sm mt-1">
                    <span className={calculations.difference > 0 ? 'text-red-600' : 'text-green-600'}>
                      {calculations.difference > 0 ? '+' : ''}KES {calculations.difference?.toLocaleString()}
                      {calculations.difference > 0 ? ' (Additional charge)' : ' (Refund)'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading || !newStatus || (newStatus !== order.status && !actualDate)}
            >
              {loading ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StatusChangeModal;
