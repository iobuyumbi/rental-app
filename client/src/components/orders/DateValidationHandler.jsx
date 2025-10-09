import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { AlertTriangle, Calendar, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

/**
 * DateValidationHandler - Validates rental dates and calculates actual usage
 * Triggers when order status changes to 'completed' to check return dates
 */
const DateValidationHandler = ({
  order,
  onValidationComplete,
  onCancel,
  isOpen = false
}) => {
  const [actualReturnDate, setActualReturnDate] = useState('');
  const [setupDays, setSetupDays] = useState(1); // Default 1 day setup allowance
  const [calculations, setCalculations] = useState(null);
  const [showAdjustment, setShowAdjustment] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      // Set actual return date to today by default
      setActualReturnDate(new Date().toISOString().split('T')[0]);
      calculateUsage();
    }
  }, [isOpen, order]);

  useEffect(() => {
    if (actualReturnDate && order) {
      calculateUsage();
    }
  }, [actualReturnDate, setupDays, order]);

  const calculateUsage = () => {
    if (!order || !actualReturnDate) return;

    const startDate = new Date(order.rentalStartDate);
    const plannedEndDate = new Date(order.rentalEndDate);
    const actualEndDate = new Date(actualReturnDate);
    
    // Calculate setup allowance (grace period before rental starts)
    const setupAllowanceDate = new Date(startDate);
    setupAllowanceDate.setDate(setupAllowanceDate.getDate() - setupDays);
    
    // Calculate return allowance (grace period after rental ends)
    const returnAllowanceDate = new Date(plannedEndDate);
    returnAllowanceDate.setDate(returnAllowanceDate.getDate() + setupDays);

    // Calculate planned vs actual rental days
    const plannedDays = Math.ceil((plannedEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const actualDays = Math.ceil((actualEndDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Determine if return is within acceptable terms
    const isEarlyReturn = actualEndDate < plannedEndDate;
    const isLateReturn = actualEndDate > returnAllowanceDate;
    const isWithinGrace = actualEndDate <= returnAllowanceDate && actualEndDate >= plannedEndDate;
    
    // Calculate financial impact
    const originalAmount = order.totalAmount || 0;
    const dailyRate = plannedDays > 0 ? originalAmount / plannedDays : 0;
    
    let adjustedAmount = originalAmount;
    let adjustmentReason = 'No adjustment needed';
    
    if (isEarlyReturn) {
      // Early return - potential refund
      adjustedAmount = Math.max(dailyRate * actualDays, originalAmount * 0.5); // Minimum 50% charge
      adjustmentReason = 'Early return - adjusted for actual usage';
    } else if (isLateReturn) {
      // Late return - additional charges
      const extraDays = Math.ceil((actualEndDate - returnAllowanceDate) / (1000 * 60 * 60 * 24));
      const penaltyRate = dailyRate * 1.5; // 50% penalty for late returns
      adjustedAmount = originalAmount + (extraDays * penaltyRate);
      adjustmentReason = `Late return - ${extraDays} day(s) penalty applied`;
    }

    const calculations = {
      startDate,
      plannedEndDate,
      actualEndDate,
      setupAllowanceDate,
      returnAllowanceDate,
      plannedDays,
      actualDays,
      isEarlyReturn,
      isLateReturn,
      isWithinGrace,
      originalAmount,
      adjustedAmount,
      adjustmentReason,
      dailyRate,
      extraDays: isLateReturn ? Math.ceil((actualEndDate - returnAllowanceDate) / (1000 * 60 * 60 * 24)) : 0,
      refundAmount: isEarlyReturn ? originalAmount - adjustedAmount : 0,
      penaltyAmount: isLateReturn ? adjustedAmount - originalAmount : 0
    };

    setCalculations(calculations);
    setShowAdjustment(isEarlyReturn || isLateReturn);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    if (!calculations) return null;

    if (calculations.isEarlyReturn) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Early Return</Badge>;
    } else if (calculations.isLateReturn) {
      return <Badge variant="destructive">Late Return</Badge>;
    } else if (calculations.isWithinGrace) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Within Grace Period</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-100 text-green-800">On Time</Badge>;
    }
  };

  const handleConfirm = () => {
    if (!calculations) return;

    const validationResult = {
      actualReturnDate,
      calculations,
      requiresAdjustment: showAdjustment,
      adjustedAmount: calculations.adjustedAmount,
      originalAmount: calculations.originalAmount
    };

    onValidationComplete(validationResult);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Validate Return Date & Calculate Usage
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Order #{order?._id?.slice(-6).toUpperCase()}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Planned Start:</span> {formatDate(order?.rentalStartDate)}
              </div>
              <div>
                <span className="font-medium">Planned End:</span> {formatDate(order?.rentalEndDate)}
              </div>
              <div>
                <span className="font-medium">Original Amount:</span> KES {order?.totalAmount?.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Planned Days:</span> {calculations?.plannedDays || 0}
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="actualReturnDate">Actual Return Date</Label>
              <Input
                id="actualReturnDate"
                type="date"
                value={actualReturnDate}
                onChange={(e) => setActualReturnDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="setupDays">Setup/Grace Days</Label>
              <Input
                id="setupDays"
                type="number"
                min="0"
                max="7"
                value={setupDays}
                onChange={(e) => setSetupDays(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Allowance for setup/travel time
              </p>
            </div>
          </div>

          {/* Calculations Display */}
          {calculations && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Usage Analysis
                </h3>
                {getStatusBadge()}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Actual Days Used:</span> {calculations.actualDays}
                </div>
                <div>
                  <span className="font-medium">Daily Rate:</span> KES {calculations.dailyRate.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Grace Period Until:</span> {formatDate(calculations.returnAllowanceDate)}
                </div>
                <div>
                  <span className="font-medium">Return Status:</span> {calculations.adjustmentReason}
                </div>
              </div>

              {/* Financial Impact */}
              {showAdjustment && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">Amount Adjustment Required</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Original Amount:</span> KES {calculations.originalAmount.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Adjusted Amount:</span> KES {calculations.adjustedAmount.toLocaleString()}
                    </div>
                    
                    {calculations.isEarlyReturn && (
                      <div className="col-span-2 text-blue-600">
                        <span className="font-medium">Potential Refund:</span> KES {calculations.refundAmount.toLocaleString()}
                      </div>
                    )}
                    
                    {calculations.isLateReturn && (
                      <div className="col-span-2 text-red-600">
                        <span className="font-medium">Late Penalty:</span> KES {calculations.penaltyAmount.toLocaleString()} 
                        ({calculations.extraDays} extra days)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {calculations.isLateReturn && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-medium">Late Return Detected</p>
                    <p>Items returned {calculations.extraDays} day(s) after grace period. Additional charges apply.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!calculations}>
              {showAdjustment ? 'Apply Adjustment & Complete' : 'Confirm & Complete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateValidationHandler;
