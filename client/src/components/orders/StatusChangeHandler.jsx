import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Loader2, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { workersAPI } from '../../services/api';
import { workerTasksAPI } from '../../api/workerTasksAPI';

/**
 * StatusChangeHandler - Orchestrates the complete workflow after status changes
 * Handles worker task recording, date validation, and financial adjustments
 */
const StatusChangeHandler = ({ 
  order, 
  previousStatus, 
  newStatus, 
  onTaskCreated,
  onComplete,
  onOrderUpdate 
}) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDateValidation, setShowDateValidation] = useState(false);
  const [taskData, setTaskData] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  // Effect runs when status changes to trigger appropriate workflows
  useEffect(() => {
    if (newStatus === 'in_progress' && previousStatus !== 'in_progress') {
      handleStatusChangeToInProgress();
    } else if (newStatus === 'completed' && previousStatus === 'in_progress') {
      handleStatusChangeToCompleted();
    } else {
      // For other status changes, just complete
      if (onComplete) {
        onComplete();
      }
    }
  }, [newStatus, previousStatus]);

  const loadWorkers = async () => {
    try {
      setLoadingWorkers(true);
      const response = await workersAPI.workers.get();
      setWorkers(Array.isArray(response) ? response : response?.data || []);
    } catch (error) {
      console.error('Error loading workers:', error);
      toast.error('Failed to load workers');
    } finally {
      setLoadingWorkers(false);
    }
  };

  const calculateTaskAmount = (orderItems, taskType) => {
    const baseValue = orderItems?.reduce((sum, item) => 
      sum + (item.quantityRented || 1) * (item.unitPriceAtTimeOfRental || 100)
    , 0) || 1000;

    // 1% of total order value for administrative tasks
    return Math.round(baseValue * 0.01);
  };

  const handleStatusChangeToInProgress = async () => {
    await loadWorkers();
    
    const suggestedAmount = calculateTaskAmount(order.orderItems || [], 'issuing');
    
    const issuingTaskData = {
      order: order._id,
      taskType: 'issuing',
      taskAmount: suggestedAmount,
      notes: `Items issued for order #${order._id?.slice(-6).toUpperCase()}. Status changed to In Progress.`,
      workers: []
    };

    setTaskData(issuingTaskData);
    setShowTaskModal(true);
    
    toast.success('Order status updated. Please record workers who issued the items.');
  };

  const handleStatusChangeToCompleted = () => {
    setShowDateValidation(true);
    toast.info('Order completed. Please validate return date and usage calculation.');
  };

  const handleDateValidationComplete = async (validationResult) => {
    setShowDateValidation(false);

    try {
      let adjustmentMessage = 'Order completed successfully.';

      if (validationResult.requiresAdjustment) {
        const updateData = {
          totalAmount: validationResult.adjustedAmount,
          chargeableDays: validationResult.newChargeableDays,
          actualReturnDate: validationResult.actualReturnDate
        };

        if (onOrderUpdate) {
          await onOrderUpdate(order._id, updateData);
        }

        if (validationResult.calculations.isEarlyReturn) {
          adjustmentMessage = `Order completed. Amount adjusted with refund of KES ${Math.abs(validationResult.calculations.refundAmount).toLocaleString()}.`;
        } else if (validationResult.calculations.isLateReturn) {
          adjustmentMessage = `Order completed. Late return penalty of KES ${validationResult.calculations.penaltyAmount.toLocaleString()} applied.`;
        }
      }

      toast.success(adjustmentMessage);
    } catch (error) {
      console.error('Error updating order amount:', error);
      toast.error('Failed to update order amount');
    }

    // Load workers and show receiving task modal
    await loadWorkers();
    
    const suggestedAmount = calculateTaskAmount(order.orderItems || [], 'receiving');
    
    const receivingTaskData = {
      order: order._id,
      taskType: 'receiving',
      taskAmount: suggestedAmount,
      notes: `Items received back for order #${order._id?.slice(-6).toUpperCase()}. Returned on ${validationResult.actualReturnDate}.`,
      workers: []
    };

    setTaskData(receivingTaskData);
    setShowTaskModal(true);
  };

  const handleDateValidationCancel = () => {
    setShowDateValidation(false);
    toast.warning('Date validation skipped. Order status is now Completed, but charges may be inaccurate.');
    
    if (onComplete) {
      onComplete();
    }
  };

  const handleTaskSubmit = async (submittedTaskData) => {
    try {
      if (onTaskCreated) {
        await onTaskCreated(submittedTaskData);
      }
      
      setShowTaskModal(false);
      setTaskData(null);
      
      toast.success('Worker task recorded for status change');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error recording task for status change:', error);
      throw error;
    }
  };

  const handleCloseModal = () => {
    setShowTaskModal(false);
    setTaskData(null);
    
    if (onComplete) {
      onComplete();
    }
  };

  const modalContent = useMemo(() => {
    if (!taskData) return {};
    
    switch (taskData.taskType) {
      case 'issuing':
        return {
          title: 'Record Issuing Task - Items Rented Out',
          subtitle: 'Order status changed to In Progress. Please record which workers issued the items to the client.',
          label: 'Record Issuing Workers'
        };
      case 'receiving':
        return {
          title: 'Record Receiving Task - Items Returned',
          subtitle: 'Order status changed to Completed. Please record which workers received the returned items.',
          label: 'Record Receiving Workers'
        };
      default:
        return {
          title: 'Record Worker Task - Status Change',
          subtitle: 'Order status changed. Please record which workers were involved.',
          label: 'Record Task'
        };
    }
  }, [taskData]);

  return (
    <>
      {/* Date Validation Modal */}
      <DateValidationHandler
        isOpen={showDateValidation}
        order={order}
        onValidationComplete={handleDateValidationComplete}
        onCancel={handleDateValidationCancel}
      />

      {/* Worker Task Modal */}
      {showTaskModal && taskData && (
        <WorkerTaskRecorder
          isOpen={showTaskModal}
          onClose={handleCloseModal}
          order={order}
          workers={workers}
          loadingWorkers={loadingWorkers}
          onSubmit={handleTaskSubmit}
          taskTypePreset={{
            type: taskData.taskType,
            label: modalContent.label,
            suggestedAmount: taskData.taskAmount,
            description: taskData.notes
          }}
          title={modalContent.title}
          subtitle={modalContent.subtitle}
        />
      )}
    </>
  );
};

/**
 * DateValidationHandler - Validates return dates and calculates financial adjustments
 */
const DateValidationHandler = ({ isOpen, order, onValidationComplete, onCancel }) => {
  const [returnDate, setReturnDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReturnDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const handleValidate = () => {
    setLoading(true);
    
    const actualReturnDate = new Date(returnDate);
    const expectedReturnDate = new Date(order.rentalEndDate);
    const plannedDays = order.chargeableDays || 1;

    // Calculate days difference
    const dayDiff = Math.ceil((actualReturnDate - expectedReturnDate) / (1000 * 60 * 60 * 24));

    let newChargeableDays = plannedDays;
    let requiresAdjustment = false;
    let calculations = {};

    if (dayDiff > 0) {
      // Late return
      newChargeableDays += dayDiff;
      requiresAdjustment = true;
      const penaltyAmount = dayDiff * (order.totalAmount / plannedDays) * 1.5; // 50% penalty
      calculations = { 
        isLateReturn: true, 
        penaltyDays: dayDiff, 
        penaltyAmount: Math.round(penaltyAmount)
      };
    } else if (dayDiff < 0) {
      // Early return
      newChargeableDays = Math.max(1, plannedDays + dayDiff);
      requiresAdjustment = true;
      const refundAmount = -dayDiff * (order.totalAmount / plannedDays);
      calculations = { 
        isEarlyReturn: true, 
        refundDays: -dayDiff, 
        refundAmount: -Math.round(refundAmount)
      };
    }

    const adjustedAmount = Math.round((order.totalAmount / plannedDays) * newChargeableDays);

    setTimeout(() => {
      setLoading(false);
      onValidationComplete({
        requiresAdjustment,
        adjustedAmount,
        actualReturnDate: returnDate,
        calculations,
        newChargeableDays
      });
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Validate Order Completion Date</DialogTitle>
          <DialogDescription>
            Order is marked as completed. Please confirm the actual return date to calculate final charges.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Expected Return Date:</Label>
            <div className="p-2 bg-yellow-50 rounded-md font-medium text-sm">
              {new Date(order.rentalEndDate).toLocaleDateString()} ({order.chargeableDays} days)
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="returnDate">Actual Return Date</Label>
            <Input
              id="returnDate"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Skip/Cancel
            </Button>
            <Button type="button" onClick={handleValidate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Calculating...
                </>
              ) : (
                'Confirm Date & Adjust'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * WorkerTaskRecorder - Records which workers were involved in status change tasks
 */
const WorkerTaskRecorder = ({ 
  isOpen, 
  onClose, 
  workers, 
  loadingWorkers,
  onSubmit, 
  taskTypePreset, 
  title, 
  subtitle 
}) => {
  const [loading, setLoading] = useState(false);
  const [workersPresent, setWorkersPresent] = useState({});

  const handleToggleWorker = (workerId) => {
    setWorkersPresent(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const presentWorkers = Object.entries(workersPresent)
      .filter(([id, present]) => present)
      .map(([workerId]) => ({ 
        worker: workerId, 
        present: true 
      }));

    const submittedData = {
      ...taskTypePreset,
      workers: presentWorkers,
      actualAmount: taskTypePreset.suggestedAmount,
    };

    try {
      // Create the actual worker task
      await workerTasksAPI.tasks.create({
        order: submittedData.order,
        taskType: submittedData.type,
        taskAmount: submittedData.actualAmount,
        workers: presentWorkers,
        completedAt: new Date().toISOString(),
        notes: submittedData.description
      });
      
      onSubmit(submittedData);
    } catch (error) {
      toast.error(error.message || 'Failed to record worker task.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-indigo-600" />
              <span className="font-bold text-indigo-800">
                Task Amount: KES {taskTypePreset.suggestedAmount?.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-600">{taskTypePreset.description}</p>
          </div>

          <div className="space-y-2">
            <Label>Select Workers Present:</Label>
            {loadingWorkers ? (
              <div className="flex items-center justify-center p-4 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading workers...
              </div>
            ) : workers.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded-lg">
                No workers available
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {workers.map(worker => (
                  <div
                    key={worker._id}
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                      workersPresent[worker._id] 
                        ? 'bg-indigo-100 border-indigo-300' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => handleToggleWorker(worker._id)}
                  >
                    <Checkbox 
                      checked={workersPresent[worker._id] || false}
                      onChange={() => handleToggleWorker(worker._id)}
                    />
                    <span className="text-sm font-medium">
                      {worker.name}
                    </span>
                    {workersPresent[worker._id] && (
                      <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || workers.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Recording...
                </>
              ) : (
                taskTypePreset.label
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StatusChangeHandler;
