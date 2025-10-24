import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { X as XIcon, Plus, Calculator } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { workersAPI, lunchAllowanceAPI, taskRateAPI, taskCompletionAPI } from "../../services/api";

const DailyTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  // Form state
  const [taskData, setTaskData] = useState({
    taskType: "",
    quantity: 1,
    notes: "",
    date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY format
  });

  // Task rates from API
  const [taskRates, setTaskRates] = useState([]);
  const [loadingTaskRates, setLoadingTaskRates] = useState(false);

  // Worker management
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [newWorkerData, setNewWorkerData] = useState({
    name: "",
    phone: "",
    nationalId: "",
    dailyRate: 0,
  });

  // Lunch allowance
  const [includeLunchAllowance, setIncludeLunchAllowance] = useState(true);
  const [lunchAmount, setLunchAmount] = useState(100);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [addingWorker, setAddingWorker] = useState(false);

  // Load workers and task rates on mount
  useEffect(() => {
    if (isOpen) {
      loadWorkers();
      loadTaskRates();
    }
  }, [isOpen]);

  const loadWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const response = await workersAPI.workers.get();
      const workersData = response?.data || response || [];
      setWorkers(Array.isArray(workersData) ? workersData : []);
    } catch (error) {
      console.error("Error loading workers:", error);
      toast.error("Failed to load workers");
      setWorkers([]);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const loadTaskRates = async () => {
    setLoadingTaskRates(true);
    try {
      const response = await taskRateAPI.getAll({ active: 'true' });
      const taskRatesData = response?.data?.data || response?.data || response || [];
      setTaskRates(Array.isArray(taskRatesData) ? taskRatesData : []);
    } catch (error) {
      console.error("Error loading task rates:", error);
      toast.error("Failed to load task rates");
      setTaskRates([]);
    } finally {
      setLoadingTaskRates(false);
    }
  };

  // Calculate task payment
  const calculateTaskPayment = () => {
    const selectedTaskRate = taskRates.find(t => t._id === taskData.taskType);
    if (!selectedTaskRate) return 0;

    return selectedTaskRate.ratePerUnit * taskData.quantity;
  };

  // Get selected task type details
  const getSelectedTaskType = () => {
    return taskRates.find(t => t._id === taskData.taskType);
  };

  // Handle form changes
  const handleTaskDataChange = (field, value) => {
    setTaskData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle new worker form changes
  const handleNewWorkerChange = (field, value) => {
    setNewWorkerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add new worker
  const handleAddWorker = async () => {
    if (!newWorkerData.name.trim()) {
      toast.error("Worker name is required");
      return;
    }

    setAddingWorker(true);
    try {
      const response = await workersAPI.workers.create(newWorkerData);
      const newWorker = response?.data || response;
      
      // Add to workers list and select
      setWorkers(prev => [...prev, newWorker]);
      setSelectedWorker(newWorker._id);
      
      // Reset form and close
      setNewWorkerData({
        name: "",
        phone: "",
        nationalId: "",
        dailyRate: 0,
      });
      setShowAddWorker(false);
      
      toast.success(`Worker ${newWorker.name} added successfully!`);
    } catch (error) {
      console.error("Error adding worker:", error);
      toast.error("Failed to add worker");
    } finally {
      setAddingWorker(false);
    }
  };

  // Submit task
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!taskData.taskType) {
      toast.error("Please select a task type");
      return;
    }

    if (!selectedWorker) {
      toast.error("Please select a worker");
      return;
    }

    if (taskData.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const taskPayment = calculateTaskPayment();
    if (taskPayment <= 0) {
      toast.error("Task payment must be greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTaskType = getSelectedTaskType();
      const worker = workers.find(w => w._id === selectedWorker);

      // Create the task record
      const taskRecord = {
        taskRateId: taskData.taskType,
        taskType: selectedTaskType.taskType,
        taskDescription: `${selectedTaskType.taskName}: ${taskData.quantity} ${selectedTaskType.unit}${taskData.quantity > 1 ? 's' : ''}`,
        quantity: taskData.quantity,
        unitRate: selectedTaskType.ratePerUnit,
        totalAmount: taskPayment,
        workerId: selectedWorker,
        workerName: worker.name,
        date: taskData.date,
        notes: taskData.notes,
        taskCategory: "daily_maintenance",
      };

      // Save task
      await taskCompletionAPI.record(taskRecord);

      // Generate lunch allowance if enabled
      if (includeLunchAllowance && lunchAmount > 0) {
        try {
          const allowanceData = {
            date: taskData.date,
            workerIds: [selectedWorker],
            amount: lunchAmount,
            notes: `Lunch allowance for ${selectedTaskType.taskName}`,
          };

          await lunchAllowanceAPI.generate(allowanceData);
          
          toast.success(
            `Task recorded! Payment: KES ${taskPayment.toLocaleString()} + Lunch: KES ${lunchAmount}`
          );
        } catch (allowanceError) {
          console.warn("Lunch allowance generation failed:", allowanceError);
          toast.success(
            `Task recorded! Payment: KES ${taskPayment.toLocaleString()} (Lunch allowance failed - add manually)`
          );
        }
      } else {
        toast.success(`Task recorded! Payment: KES ${taskPayment.toLocaleString()}`);
      }

      // Reset form and close
      setTaskData({
        taskType: "",
        quantity: 1,
        notes: "",
        date: new Date().toLocaleDateString('en-GB'),
      });
      setSelectedWorker("");
      
      if (onTaskCreated) {
        onTaskCreated(taskRecord);
      }
      
      onClose();
    } catch (error) {
      console.error("Error recording task:", error);
      toast.error("Failed to record task");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedTaskType = getSelectedTaskType();
  const taskPayment = calculateTaskPayment();
  const totalPayment = taskPayment + (includeLunchAllowance ? lunchAmount : 0);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Record Daily Task</h2>
            <p className="text-gray-500 mt-1">
              Record worker tasks and calculate payments
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Date: {taskData.date} (Today)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="taskType">Task Type</Label>
            <Select
              value={taskData.taskType}
              onValueChange={(value) => handleTaskDataChange("taskType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                {loadingTaskRates ? (
                  <SelectItem value="loading" disabled>Loading task rates...</SelectItem>
                ) : taskRates.length === 0 ? (
                  <SelectItem value="no-rates" disabled>No task rates available. Add rates in Task Management.</SelectItem>
                ) : (
                  taskRates.map((task) => (
                    <SelectItem key={task._id} value={task._id}>
                      {task.taskName} - KES {task.ratePerUnit}/{task.unit}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity ({selectedTaskType?.unit || "units"})
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={taskData.quantity}
              onChange={(e) => handleTaskDataChange("quantity", parseInt(e.target.value) || 1)}
              placeholder="Enter quantity"
            />
          </div>

          {/* Payment Calculation Display */}
          {selectedTaskType && taskData.quantity > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-800">Payment Calculation</span>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  {taskData.quantity} {selectedTaskType.unit}{taskData.quantity > 1 ? 's' : ''} × KES {selectedTaskType.ratePerUnit} = 
                  <span className="font-bold text-green-600 ml-1">KES {taskPayment.toLocaleString()}</span>
                </p>
                {includeLunchAllowance && (
                  <p>
                    Lunch Allowance: <span className="font-bold text-orange-600">KES {lunchAmount}</span>
                  </p>
                )}
                <p className="border-t pt-1 font-bold">
                  Total Payment: <span className="text-lg text-green-700">KES {totalPayment.toLocaleString()}</span>
                </p>
              </div>
            </div>
          )}

          {/* Worker Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Select Worker</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddWorker(!showAddWorker)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add New Worker
              </Button>
            </div>

            {/* Add New Worker Form */}
            {showAddWorker && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
                <h4 className="font-semibold text-gray-700">Add New Worker</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="workerName">Full Name *</Label>
                    <Input
                      id="workerName"
                      value={newWorkerData.name}
                      onChange={(e) => handleNewWorkerChange("name", e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workerPhone">Phone</Label>
                    <Input
                      id="workerPhone"
                      value={newWorkerData.phone}
                      onChange={(e) => handleNewWorkerChange("phone", e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workerNationalId">National ID</Label>
                    <Input
                      id="workerNationalId"
                      value={newWorkerData.nationalId}
                      onChange={(e) => handleNewWorkerChange("nationalId", e.target.value)}
                      placeholder="Enter national ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workerDailyRate">Daily Rate (KES) - Use 0 for task-based payment</Label>
                    <Input
                      id="workerDailyRate"
                      type="number"
                      value={newWorkerData.dailyRate}
                      onChange={(e) => handleNewWorkerChange("dailyRate", parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleAddWorker}
                    disabled={addingWorker}
                    size="sm"
                  >
                    {addingWorker ? "Adding..." : "Add Worker"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddWorker(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Worker Selection Dropdown */}
            <Select
              value={selectedWorker}
              onValueChange={setSelectedWorker}
              disabled={loadingWorkers}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingWorkers ? "Loading workers..." : "Select worker"} />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker._id} value={worker._id}>
                    {worker.name} {worker.phone && `(${worker.phone})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lunch Allowance */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="includeLunch"
                checked={includeLunchAllowance}
                onCheckedChange={setIncludeLunchAllowance}
              />
              <Label htmlFor="includeLunch" className="font-semibold">
                Include lunch allowance
              </Label>
            </div>

            {includeLunchAllowance && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="lunchAmount">Lunch Allowance (KES)</Label>
                <Input
                  id="lunchAmount"
                  type="number"
                  min="0"
                  step="50"
                  value={lunchAmount}
                  onChange={(e) => setLunchAmount(parseInt(e.target.value) || 100)}
                  className="w-32"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={taskData.notes}
              onChange={(e) => handleTaskDataChange("notes", e.target.value)}
              placeholder="Add any additional notes about this task"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !taskData.taskType || !selectedWorker}
            >
              {isSubmitting ? "Recording..." : "Record Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyTaskModal;
