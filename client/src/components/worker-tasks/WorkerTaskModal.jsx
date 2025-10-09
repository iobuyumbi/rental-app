import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X as XIcon, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { lunchAllowanceAPI } from '../../services/api';
import TaskCalculator from '../orders/TaskCalculator';

const taskTypeOptions = [
  { value: 'issuing', label: 'Issuing Items' },
  { value: 'receiving', label: 'Receiving Items' },
  { value: 'loading', label: 'Loading Truck/Pickup' },
  { value: 'unloading', label: 'Unloading Truck/Pickup' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other Task' }
];

const WorkerTaskModal = ({
  isOpen,
  onClose,
  order,
  workers,
  onSubmit,
  existingTask = null,
  taskTypePreset = null // New prop for preset task configuration
}) => {
  const [taskData, setTaskData] = useState({
    order: '',
    taskType: 'issuing',
    taskAmount: 0,
    notes: '',
    workers: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generateLunchAllowance, setGenerateLunchAllowance] = useState(true);
  const [lunchAllowanceAmount, setLunchAllowanceAmount] = useState(200); // Default KES 200
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  // Initialize form with existing task data if editing, or preset data if provided
  useEffect(() => {
    if (existingTask) {
      setTaskData({
        order: existingTask.order._id || existingTask.order,
        taskType: existingTask.taskType,
        taskAmount: existingTask.taskAmount,
        notes: existingTask.notes || '',
        workers: existingTask.workers.map(w => ({
          worker: w.worker._id || w.worker,
          present: w.present
        }))
      });
    } else if (order) {
      setTaskData(prev => ({
        ...prev,
        order: order._id,
        taskType: taskTypePreset?.type || 'issuing',
        taskAmount: taskTypePreset?.suggestedAmount || 0,
        notes: taskTypePreset?.description || ''
      }));
    }
  }, [existingTask, order, taskTypePreset]);

  // Initialize workers list when workers prop changes
  useEffect(() => {
    if (workers && workers.length > 0 && !existingTask) {
      // Only set initial workers if we're not editing an existing task
      setTaskData(prev => ({
        ...prev,
        workers: workers.map(worker => ({
          worker: worker._id,
          present: false
        }))
      }));
    }
  }, [workers, existingTask]);

  const handleChange = (field, value) => {
    setTaskData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleWorkerPresenceChange = (workerId, isPresent) => {
    setTaskData(prev => ({
      ...prev,
      workers: prev.workers.map(w => 
        w.worker === workerId ? { ...w, present: isPresent } : w
      )
    }));
  };

  // Handle calculated amount from TaskCalculator
  const handleAmountCalculated = (amount) => {
    setCalculatedAmount(amount);
    // Auto-update task amount if it's currently 0 or matches previous calculation
    if (taskData.taskAmount === 0 || taskData.taskAmount === calculatedAmount) {
      setTaskData(prev => ({
        ...prev,
        taskAmount: amount
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!taskData.order) {
      newErrors.order = 'Order is required';
    }
    
    if (!taskData.taskType) {
      newErrors.taskType = 'Task type is required';
    }
    
    if (!taskData.taskAmount || taskData.taskAmount <= 0) {
      newErrors.taskAmount = 'Task amount must be greater than 0';
    }
    
    const presentWorkers = taskData.workers.filter(w => w.present);
    if (presentWorkers.length === 0) {
      newErrors.workers = 'At least one worker must be present';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Save the worker task first
      await onSubmit(taskData);
      
      // Generate lunch allowances if enabled and we have present workers
      if (generateLunchAllowance && !existingTask) {
        const presentWorkers = taskData.workers.filter(w => w.present);
        
        if (presentWorkers.length > 0) {
          try {
            const allowanceData = {
              date: new Date().toISOString().split('T')[0], // Today's date
              workerIds: presentWorkers.map(w => w.worker),
              amount: lunchAllowanceAmount,
              orderId: taskData.order,
              notes: `Generated from ${taskData.taskType} task`
            };
            
            const result = await lunchAllowanceAPI.generate(allowanceData);
            
            // Handle the response - could be success or info about duplicates
            if (result.created && result.created.length > 0) {
              toast.success(`Task created! Generated ${result.created.length} lunch allowances (KES ${lunchAllowanceAmount * result.created.length} total)`);
            } else if (result.skipped && result.skipped.length > 0) {
              toast.info(`Task created! ${result.skipped.length} lunch allowances already exist for today`);
            } else {
              toast.success('Task created successfully');
            }
          } catch (allowanceError) {
            console.warn('Lunch allowance generation failed:', allowanceError);
            // Don't fail the whole operation, just show a warning
            toast.warning('Task created, but lunch allowance generation failed. You can generate them manually later.');
          }
        } else {
          toast.success(existingTask ? 'Task updated successfully' : 'Task created successfully');
        }
      } else {
        toast.success(existingTask ? 'Task updated successfully' : 'Task created successfully');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving worker task:', error);
      toast.error(error.message || 'Failed to save worker task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate share per worker
  const presentWorkersCount = taskData.workers.filter(w => w.present).length;
  const sharePerWorker = presentWorkersCount > 0 
    ? (taskData.taskAmount / presentWorkersCount).toFixed(2)
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              {existingTask ? 'Edit Worker Task' : 
               taskTypePreset ? `Record ${taskTypePreset.label}` : 
               'Record Worker Task'}
            </h2>
            <p className="text-gray-500 mt-1">
              {taskTypePreset ? taskTypePreset.description : 'Record worker participation and task details'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Type */}
          <div className="space-y-2">
            <Label htmlFor="taskType">Task Type</Label>
            <Select
              value={taskData.taskType}
              onValueChange={(value) => handleChange('taskType', value)}
            >
              <SelectTrigger id="taskType" className={errors.taskType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                {taskTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.taskType && <p className="text-red-500 text-sm">{errors.taskType}</p>}
          </div>

          {/* Task Amount */}
          <div className="space-y-2">
            <Label htmlFor="taskAmount">Task Amount (KES)</Label>
            <Input
              id="taskAmount"
              type="number"
              value={taskData.taskAmount}
              onChange={(e) => handleChange('taskAmount', parseFloat(e.target.value) || 0)}
              className={errors.taskAmount ? 'border-red-500' : ''}
              min="0"
              step="0.01"
            />
            {errors.taskAmount && <p className="text-red-500 text-sm">{errors.taskAmount}</p>}
            
            {/* Automatic Task Calculator */}
            {order && order.items && order.items.length > 0 && (
              <TaskCalculator
                orderItems={order.items}
                taskType={taskData.taskType}
                onAmountCalculated={handleAmountCalculated}
              />
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={taskData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any additional notes about this task"
              rows={3}
            />
          </div>

          {/* Workers Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Workers Present</Label>
              <div className="text-sm text-gray-500">
                Share per worker: KES {sharePerWorker}
              </div>
            </div>
            
            {errors.workers && <p className="text-red-500 text-sm">{errors.workers}</p>}
            
            <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
              {taskData.workers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No workers available</p>
              ) : (
                taskData.workers.map((workerItem, index) => {
                  const workerData = workers.find(w => w._id === workerItem.worker);
                  return (
                    <div key={workerItem.worker} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={`worker-${workerItem.worker}`}
                        checked={workerItem.present}
                        onCheckedChange={(checked) => handleWorkerPresenceChange(workerItem.worker, checked)}
                      />
                      <Label htmlFor={`worker-${workerItem.worker}`} className="flex-1 cursor-pointer">
                        {workerData?.name || 'Unknown Worker'}
                      </Label>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Lunch Allowance Section */}
          {!existingTask && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="generateLunchAllowance"
                  checked={generateLunchAllowance}
                  onCheckedChange={setGenerateLunchAllowance}
                />
                <Label htmlFor="generateLunchAllowance" className="cursor-pointer">
                  Generate lunch allowance for present workers
                </Label>
              </div>
              
              {generateLunchAllowance && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="lunchAllowanceAmount">Allowance per worker (KES)</Label>
                  <Input
                    id="lunchAllowanceAmount"
                    type="number"
                    value={lunchAllowanceAmount}
                    onChange={(e) => setLunchAllowanceAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="50"
                    className="w-32"
                  />
                  <p className="text-sm text-gray-500">
                    Total: KES {(lunchAllowanceAmount * presentWorkersCount).toFixed(2)} for {presentWorkersCount} present worker{presentWorkersCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : existingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerTaskModal;