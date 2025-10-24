import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { AlertTriangle, Calendar, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

/**
 * DateValidationHandler - Advanced rental date validation and financial adjustment
 * Based on sophisticated business logic for early/late returns with grace periods
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

  // Utility to convert Date objects to start-of-day for consistent day-count calculations
  const getStartOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const calculateUsage = useCallback(() => {
    if (!order || !actualReturnDate) return;

    // Use UTC dates to avoid local timezone issues for comparison
    const startDate = getStartOfDay(order.rentalStartDate);
    const plannedEndDate = getStartOfDay(order.rentalEndDate);
    const actualEndDate = getStartOfDay(actualReturnDate);

    // Calculate setup allowance (grace period before rental starts)
    const setupAllowanceDate = new Date(startDate);
    setupAllowanceDate.setDate(setupAllowanceDate.getDate() - setupDays);
    
    // Calculate return allowance (grace period *after* rental ends)
    const returnAllowanceDate = new Date(plannedEndDate);
    returnAllowanceDate.setDate(returnAllowanceDate.getDate() + setupDays);

    // Calculate planned vs actual rental duration in milliseconds
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    
    // Planned days: The duration from planned start to planned end (inclusive of start and end day)
    const plannedDays = Math.ceil((plannedEndDate - startDate) / MS_PER_DAY) + 1;
    
    // Actual days: The duration from planned start to actual return date (inclusive)
    const actualDays = Math.max(0, Math.ceil((actualEndDate - startDate) / MS_PER_DAY) + 1);
    
    // Determine return status
    const isEarlyReturn = actualEndDate < plannedEndDate;
    // Check if actual return date is strictly after the grace period ends
    const isLateReturn = actualEndDate > returnAllowanceDate;
    const isWithinGrace = !isEarlyReturn && actualEndDate <= returnAllowanceDate;
    
    // Calculate financial impact
    const originalAmount = order.totalAmount || 0;
    const dailyRate = plannedDays > 0 ? originalAmount / plannedDays : 0;
    
    let adjustedAmount = originalAmount;
    let adjustmentReason = 'On-time return (within grace period)';
    
    if (isEarlyReturn) {
      // Early return - potential refund
      // Policy: Charge for actual used days, but minimum 50% of original amount
      const costForUsedDays = dailyRate * actualDays;
      const minCharge = originalAmount * 0.5;
      
      adjustedAmount = Math.max(costForUsedDays, minCharge); 
      adjustmentReason = 'Early return - adjusted for actual usage (minimum charge applies)';

      if (adjustedAmount === minCharge) {
        adjustmentReason = 'Early return - minimum 50% charge applied';
      }
    } else if (isLateReturn) {
      // Late return - additional charges
      // Calculate days late *after* the grace period ends
      const extraDaysMs = actualEndDate - returnAllowanceDate;
      const extraDays = Math.ceil(extraDaysMs / MS_PER_DAY);
      
      const penaltyRate = dailyRate * 1.5; // 50% penalty on daily rate
      const penaltyAmount = extraDays * penaltyRate;
      
      adjustedAmount = originalAmount + penaltyAmount;
      adjustmentReason = `Late return - ${extraDays} day(s) penalty applied`;
    }

    const calculationResults = {
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
      adjustedAmount: parseFloat(adjustedAmount.toFixed(2)),
      adjustmentReason,
      dailyRate: parseFloat(dailyRate.toFixed(2)),
      extraDays: isLateReturn ? Math.ceil((actualEndDate - returnAllowanceDate) / MS_PER_DAY) : 0,
      // Refund is positive if Early Return, otherwise 0
      refundAmount: isEarlyReturn ? parseFloat((originalAmount - adjustedAmount).toFixed(2)) : 0,
      // Penalty is positive if Late Return, otherwise 0
      penaltyAmount: isLateReturn ? parseFloat((adjustedAmount - originalAmount).toFixed(2)) : 0
    };

    setCalculations(calculationResults);
    setShowAdjustment(isEarlyReturn || isLateReturn);
  }, [order, actualReturnDate, setupDays]);
  
  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && order) {
      // Set actual return date to today by default on open
      const today = new Date().toISOString().split('T')[0];
      setActualReturnDate(today);
    }
  }, [isOpen, order]);

  // Recalculate whenever inputs change
  useEffect(() => {
    calculateUsage();
  }, [actualReturnDate, setupDays, order, calculateUsage]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `KES ${amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
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
            <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2 text-indigo-700">
                  <Clock className="h-5 w-5" />
                  Usage Analysis
                </h3>
                {getStatusBadge()}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Actual Days Used:</span> <span className="font-bold">{calculations.actualDays}</span>
                </div>
                <div>
                  <span className="font-medium">Daily Rate:</span> {formatCurrency(calculations.dailyRate)}
                </div>
                <div>
                  <span className="font-medium">Grace Period Until:</span> <span className="font-bold">{formatDate(calculations.returnAllowanceDate)}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Status:</span> {calculations.adjustmentReason}
                </div>
              </div>

              {/* Financial Impact */}
              {showAdjustment && (
                <div className="mt-4 p-4 bg-white border border-yellow-300 rounded-lg shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-lg text-yellow-800">Amount Adjustment Required</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm font-semibold">
                    <div>
                      <span className="text-gray-500 font-normal block">Original Amount</span> 
                      {formatCurrency(calculations.originalAmount)}
                    </div>
                    
                    {calculations.isEarlyReturn && (
                      <div className="text-blue-600">
                        <span className="text-gray-500 font-normal block">Refund Amount</span>
                        {formatCurrency(calculations.refundAmount)}
                      </div>
                    )}
                    
                    {calculations.isLateReturn && (
                      <div className="text-red-600">
                        <span className="text-gray-500 font-normal block">Late Penalty</span>
                        {formatCurrency(calculations.penaltyAmount)}
                      </div>
                    )}

                    <div className="col-span-3 lg:col-span-1 border-l-4 pl-3 border-indigo-500">
                      <span className="text-gray-500 font-normal block">New Total Due</span> 
                      <span className="text-xl text-indigo-700">{formatCurrency(calculations.adjustedAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {calculations.isLateReturn && (
                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Late Return Warning</p>
                    <p>Items were returned {calculations.extraDays} day(s) after the grace period ended. A <strong>{formatCurrency(calculations.penaltyAmount)} penalty</strong> has been applied.</p>
                  </div>
                </div>
              )}
              
              {calculations.isEarlyReturn && (
                <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg flex items-start gap-2">
                  <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Early Return Noted</p>
                    <p>Items were returned early. A <strong>{formatCurrency(calculations.refundAmount)} refund</strong> is due to the customer, subject to the minimum charge policy.</p>
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
            <Button 
              onClick={() => {
                if (!calculations) {
                  toast.error("Calculation required before confirmation.");
                  return;
                }
                const validationResult = {
                  actualReturnDate,
                  calculations,
                  requiresAdjustment: showAdjustment,
                  adjustedAmount: calculations.adjustedAmount,
                  originalAmount: calculations.originalAmount
                };
                onValidationComplete(validationResult);
                toast.success(`Validation complete. Adjusted amount: ${formatCurrency(calculations.adjustedAmount)}`);
              }} 
              disabled={!calculations || !actualReturnDate}
            >
              {showAdjustment ? 'Apply Adjustment & Complete' : 'Confirm & Complete'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DateValidationHandler;
