import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { updateOrderStatusAndRecordTask } from '../../features/orders/ordersWorkflow';
import { Checkbox } from '../ui/checkbox';

const OrderStatusManager = ({ 
  order, 
  onStatusChange, 
  onComplete,
  workers = []
}) => {
  const [step, setStep] = useState(1);
  const [statusData, setStatusData] = useState({
    status: '',
    actualDate: order.actualReturnDate || new Date().toISOString().split('T')[0],
    chargeableDays: order.defaultChargeableDays || 1,
    workers: []
  });
  const [calculations, setCalculations] = useState(null);
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  useEffect(() => {
    // Initialize with available next statuses
    const availableStatuses = getAvailableStatuses(order.status);
    if (availableStatuses.length > 0) {
      setStatusData(prev => ({
        ...prev,
        status: availableStatuses[0]
      }));
    }
    
    // Initialize with available workers if provided
    if (workers && workers.length > 0) {
      setSelectedWorkers(workers.map(worker => ({
        ...worker,
        present: true
      })));
    }
  }, [order, workers]);

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

  const calculateAdjustedAmount = () => {
    try {
      const startDate = new Date(order.rentalStartDate);
      const endDate = new Date(order.rentalEndDate);
      const actualDateObj = new Date(statusData.actualDate);
      
      // Calculate planned rental period
      const plannedPeriodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      // Default chargeable days
      const defaultChargeableDays = order.defaultChargeableDays || 1;
      let calculatedDays = statusData.chargeableDays || defaultChargeableDays;
      let adjustedAmount = order.totalAmount;
      
      // Calculate daily rate
      let dailyRate = order.totalAmount / defaultChargeableDays;
      
      // Calculate based on status change
      if (statusData.status === 'completed') {
        // For completion, calculate actual usage
        const actualUsageDays = Math.ceil((actualDateObj - startDate) / (1000 * 60 * 60 * 24)) + 1;
        calculatedDays = statusData.chargeableDays || actualUsageDays;
        
        // Recalculate the total amount based on items
        let recalculatedAmount = 0;
        if (order.items && order.items.length > 0) {
          recalculatedAmount = order.items.reduce((sum, item) => {
            return sum + (item.quantity * item.unitPrice * defaultChargeableDays);
          }, 0);
          // Use recalculated amount if available, otherwise use order.totalAmount
          adjustedAmount = recalculatedAmount > 0 ? recalculatedAmount : order.totalAmount;
        }
        
        // Apply pricing rules
        if (calculatedDays < defaultChargeableDays) {
          // Early return - minimum 50% charge
          const minimumCharge = adjustedAmount * 0.5;
          const calculatedCharge = calculatedDays * dailyRate;
          adjustedAmount = Math.max(minimumCharge, calculatedCharge);
        } else if (calculatedDays > defaultChargeableDays) {
          // Extended usage - charge extra at 150% rate
          const extraDays = calculatedDays - defaultChargeableDays;
          adjustedAmount = adjustedAmount + (extraDays * dailyRate * 1.5);
        }
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
        actualDate: statusData.actualDate
      });

      return {
        chargeableDays: calculatedDays,
        adjustedAmount
      };
    } catch (error) {
      console.error('Error calculating adjusted amount:', error);
      return {
        chargeableDays: statusData.chargeableDays,
        adjustedAmount: order.totalAmount
      };
    }
  };

  const handleStatusChange = async () => {
    try {
      // Calculate final amounts
      const { chargeableDays, adjustedAmount } = calculateAdjustedAmount();
      
      // Prepare final status data
      const finalStatusData = {
        status: statusData.status,
        actualDate: statusData.actualDate,
        chargeableDays,
        adjustedAmount,
        calculations,
        workers: selectedWorkers.map(worker => ({
          workerId: worker._id,
          present: true
        }))
      };

      // Update order status and record task
      await updateOrderStatusAndRecordTask({
        order,
        statusData: finalStatusData,
        onInventoryUpdated: () => {
          if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent("inventoryUpdated"));
          }
        }
      });
      
      toast.success(`Order status updated to ${statusData.status}`);
      
      if (onStatusChange) {
        onStatusChange(finalStatusData);
      }
      
      onComplete();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const handleDateChange = (e) => {
    setStatusData(prev => ({
      ...prev,
      actualDate: e.target.value
    }));
    calculateAdjustedAmount();
  };

  const handleChargeableDaysChange = (e) => {
    const days = parseInt(e.target.value) || 0;
    setStatusData(prev => ({
      ...prev,
      chargeableDays: days
    }));
    calculateAdjustedAmount();
  };

  const handleWorkerToggle = (workerId) => {
    setSelectedWorkers(prev => {
      const isSelected = prev.some(w => w._id === workerId);
      if (isSelected) {
        return prev.filter(w => w._id !== workerId);
      } else {
        const worker = workers.find(w => w._id === workerId);
        return [...prev, worker];
      }
    });
  };

  // Render appropriate step content
  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Status selection */}
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select 
                value={statusData.status} 
                onValueChange={(value) => setStatusData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map(status => {
                    const option = statusOptions.find(opt => opt.value === status);
                    return (
                      <SelectItem key={status} value={status}>
                        {option?.label || status}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Date selection */}
            <div className="space-y-2">
              <Label htmlFor="actualDate">Actual Date</Label>
              <Input
                id="actualDate"
                type="date"
                value={statusData.actualDate}
                onChange={handleDateChange}
              />
            </div>

            {/* Chargeable days */}
            {statusData.status === 'completed' && (
              <div className="space-y-2">
                <Label htmlFor="chargeableDays">Chargeable Days</Label>
                <Input
                  id="chargeableDays"
                  type="number"
                  min="0"
                  value={statusData.chargeableDays}
                  onChange={handleChargeableDaysChange}
                />
                <p className="text-sm text-gray-500">
                  Default: {order.defaultChargeableDays || 1} day(s)
                </p>
              </div>
            )}

            {/* Price calculation summary */}
            {calculations && (
              <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
                <p className="font-medium">Price Calculation</p>
                <p>Original Amount: KES {calculations.originalAmount.toLocaleString()}</p>
                <p>Adjusted Amount: KES {calculations.adjustedAmount.toLocaleString()}</p>
                {calculations.difference !== 0 && (
                  <p className={calculations.difference > 0 ? 'text-red-600' : 'text-green-600'}>
                    {calculations.difference > 0 ? 'Additional Charge' : 'Refund'}: 
                    KES {Math.abs(calculations.difference).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={onComplete}>Cancel</Button>
              <Button onClick={() => setStep(2)}>Next: Select Workers</Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Workers</Label>
              <p className="text-sm text-gray-500">
                Choose workers who participated in this status change
              </p>
              
              <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                {workers.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 p-2">No workers available</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.location.href = '/workers/new'}
                    >
                      Create New Worker
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-sm font-medium mb-2">
                      Selected workers: {selectedWorkers.filter(w => w.present).length} of {workers.length}
                    </div>
                    {workers.map(worker => (
                      <div key={worker._id} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded">
                        <Checkbox 
                          id={`worker-${worker._id}`}
                          checked={selectedWorkers.find(w => w._id === worker._id)?.present || false}
                          onCheckedChange={(checked) => {
                            setSelectedWorkers(prev => 
                              prev.map(w => w._id === worker._id ? {...w, present: !!checked} : w)
                            );
                          }}
                        />
                        <Label htmlFor={`worker-${worker._id}`} className="flex-grow cursor-pointer">
                          {worker.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="pt-4 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={handleStatusChange}>Update Status</Button>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md space-y-3">
              <h3 className="font-medium">Order Status Change Summary</h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-500">Current Status:</div>
                <div>{order.status}</div>
                
                <div className="text-gray-500">New Status:</div>
                <div>{statusData.status}</div>
                
                <div className="text-gray-500">Date:</div>
                <div>{new Date(statusData.actualDate).toLocaleDateString()}</div>
                
                {statusData.status === 'completed' && (
                  <>
                    <div className="text-gray-500">Chargeable Days:</div>
                    <div>{statusData.chargeableDays}</div>
                    
                    <div className="text-gray-500">Original Amount:</div>
                    <div>KES {(order.totalAmount || 0).toLocaleString()}</div>
                    
                    <div className="text-gray-500">Adjusted Amount:</div>
                    <div>KES {(calculations?.adjustedAmount || order.totalAmount || 0).toLocaleString()}</div>
                    
                    {calculations?.difference !== 0 && (
                      <>
                        <div className="text-gray-500">
                          {calculations?.difference > 0 ? 'Additional Charge:' : 'Refund:'}
                        </div>
                        <div className={calculations?.difference > 0 ? 'text-red-600' : 'text-green-600'}>
                          KES {Math.abs(calculations?.difference || 0).toLocaleString()}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium">Selected Workers ({selectedWorkers.length})</h4>
                {selectedWorkers.length === 0 ? (
                  <p className="text-sm text-gray-500">No workers selected</p>
                ) : (
                  <ul className="text-sm list-disc pl-5">
                    {selectedWorkers.map(worker => (
                      <li key={worker._id}>{worker.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleStatusChange}>Confirm Changes</Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onComplete}
      title={`Update Order Status - #${order._id?.slice(-6).toUpperCase()}`}
      description="Update order status with a streamlined workflow"
      size="large"
    >
      <div className="py-4">
        {renderStepContent()}
      </div>
    </Modal>
  );
};

export default OrderStatusManager;