import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '../components/ui/button';

import { useDataManager } from '../hooks/useDataManager';
import { useFormManager } from '../hooks/useFormManager';
import { taskRateAPI, taskCompletionAPI, ordersAPI, workersAPI } from '../services/api';

// Import our new components
import TaskTabs from '../components/tasks/TaskTabs';
import TaskRateForm from '../components/tasks/TaskRateForm';
import TaskCompletionForm from '../components/tasks/TaskCompletionForm';
import TaskRatesTable from '../components/tasks/TaskRatesTable';
import TaskCompletionsTable from '../components/tasks/TaskCompletionsTable';

const TaskManagementPage = () => {
  const [activeTab, setActiveTab] = useState('rates');
  const [showAddRate, setShowAddRate] = useState(false);
  const [showRecordTask, setShowRecordTask] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [orders, setOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);

  // Task Rates Management
  const ratesManager = useDataManager({
    fetchFn: useCallback(async () => {
      const result = await taskRateAPI.getAll({ active: 'true' });
      // Return the actual data array from the nested structure
      return result.data.data || [];
    }, []),
    createFn: useCallback((data) => taskRateAPI.create(data), []),
    updateFn: useCallback((id, data) => taskRateAPI.update(id, data), []),
    deleteFn: useCallback((id) => taskRateAPI.delete(id), []),
    entityName: 'task rate'
  });

  // Task Completions Management
  const completionsManager = useDataManager({
    fetchFn: useCallback(() => taskCompletionAPI.getAll(), []),
    createFn: useCallback((data) => taskCompletionAPI.record(data), []),
    updateFn: useCallback((id, data) => taskCompletionAPI.update(id, data), []),
    entityName: 'task completion'
  });

  // Form managers
  const rateForm = useFormManager({
    taskType: '',
    taskName: '',
    ratePerUnit: '',
    unit: '',
    description: ''
  }, {
    taskType: { required: true },
    taskName: { required: true },
    ratePerUnit: { required: true, min: 0 },
    unit: { required: true }
  });

  const taskForm = useFormManager({
    taskRateId: '',
    orderId: '',
    quantityCompleted: '',
    taskDescription: '',
    taskDate: new Date().toISOString().split('T')[0]
  }, {
    taskRateId: { required: true },
    orderId: { required: true },
    quantityCompleted: { required: true, min: 1 }
  });

  // Load supporting data
  useEffect(() => {
    loadSupportingData();
  }, []);

  const loadSupportingData = async () => {
    try {
      const [ordersRes, workersRes] = await Promise.all([
        ordersAPI.getAll(),
        workersAPI.workers.get()
      ]);
      setOrders(ordersRes.data?.data || []);
      setWorkers(workersRes.data?.data || []);
    } catch (error) {
      console.error('Error loading supporting data:', error);
      toast.error('Failed to load orders and workers');
    }
  };

  // Task Rate handlers
  const handleAddRate = async (e) => {
    e.preventDefault();
    try {
      await ratesManager.createItem({
        ...rateForm.values,
        ratePerUnit: parseFloat(rateForm.values.ratePerUnit)
      });
      toast.success('Task rate added successfully');
      setShowAddRate(false);
      rateForm.reset();
    } catch (error) {
      console.error('Error adding task rate:', error);
      toast.error('Failed to add task rate');
    }
  };

  const handleEditRate = (rate) => {
    setEditingRate(rate);
    rateForm.updateValues(rate);
    setShowAddRate(true);
  };

  const handleUpdateRate = async (e) => {
    e.preventDefault();
    try {
      await ratesManager.updateItem(editingRate._id, {
        ...rateForm.values,
        ratePerUnit: parseFloat(rateForm.values.ratePerUnit)
      });
      toast.success('Task rate updated successfully');
      setShowAddRate(false);
      setEditingRate(null);
      rateForm.reset();
    } catch (error) {
      console.error('Error updating task rate:', error);
      toast.error('Failed to update task rate');
    }
  };

  const handleDeleteRate = async (id) => {
    if (window.confirm('Are you sure you want to delete this task rate?')) {
      try {
        await ratesManager.deleteItem(id);
        toast.success('Task rate deleted successfully');
      } catch (error) {
        console.error('Error deleting task rate:', error);
        toast.error('Failed to delete task rate');
      }
    }
  };

  // Task Completion handlers
  const handleRecordTask = async (e) => {
    e.preventDefault();
    try {
      const workersPresent = selectedWorkers.map(workerId => ({
        worker: workerId,
        hoursWorked: 8 // Default 8 hours, can be customized
      }));

      await completionsManager.createItem({
        ...taskForm.values,
        quantityCompleted: parseInt(taskForm.values.quantityCompleted),
        workersPresent
      });
      
      toast.success('Task completion recorded successfully');
      setShowRecordTask(false);
      taskForm.reset();
      setSelectedWorkers([]);
    } catch (error) {
      console.error('Error recording task completion:', error);
      toast.error('Failed to record task completion');
    }
  };

  const handleVerifyTask = async (id) => {
    try {
      await taskCompletionAPI.verify(id, 'Verified by admin');
      toast.success('Task verified successfully');
      completionsManager.refresh();
    } catch (error) {
      console.error('Error verifying task:', error);
      toast.error('Failed to verify task');
    }
  };

  const handleCloseRateModal = () => {
    setShowAddRate(false);
    setEditingRate(null);
    rateForm.reset();
  };

  const handleCloseTaskModal = () => {
    setShowRecordTask(false);
    taskForm.reset();
    setSelectedWorkers([]);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <div className="flex gap-2">
          {activeTab === 'rates' && (
            <Button onClick={() => setShowAddRate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task Rate
            </Button>
          )}
          {activeTab === 'completions' && (
            <Button onClick={() => setShowRecordTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Task
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <TaskTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Content */}
      {activeTab === 'rates' && (
        <TaskRatesTable
          taskRates={ratesManager.data}
          loading={ratesManager.loading}
          onEditRate={handleEditRate}
          onDeleteRate={handleDeleteRate}
        />
      )}

      {activeTab === 'completions' && (
        <TaskCompletionsTable
          taskCompletions={completionsManager.data}
          loading={completionsManager.loading}
          onVerifyTask={handleVerifyTask}
        />
      )}

      {/* Add/Edit Task Rate Modal */}
      <TaskRateForm
        isOpen={showAddRate}
        onClose={handleCloseRateModal}
        onSubmit={editingRate ? handleUpdateRate : handleAddRate}
        formData={rateForm.values}
        onFormChange={rateForm.updateValues}
        errors={rateForm.errors}
        editingRate={editingRate}
      />

      {/* Record Task Completion Modal */}
      <TaskCompletionForm
        isOpen={showRecordTask}
        onClose={handleCloseTaskModal}
        onSubmit={handleRecordTask}
        formData={taskForm.values}
        onFormChange={taskForm.updateValues}
        errors={taskForm.errors}
        taskRates={ratesManager.data}
        orders={orders}
        workers={workers}
        selectedWorkers={selectedWorkers}
        setSelectedWorkers={setSelectedWorkers}
      />
    </div>
  );
};

export default TaskManagementPage;
