import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, DollarSign, Users, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import DataTable from '../components/common/DataTable';
import FormModal from '../components/common/FormModal';
import { Badge } from '../components/ui/badge';

import { useDataManager } from '../hooks/useDataManager';
import { useFormManager } from '../hooks/useFormManager';
import { taskRateAPI, taskCompletionAPI, ordersAPI, workersAPI } from '../services/api';

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

  // Table columns
  const rateColumns = [
    {
      key: 'taskType',
      label: 'Task Type',
      render: (value) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      )
    },
    { key: 'taskName', label: 'Task Name' },
    {
      key: 'ratePerUnit',
      label: 'Rate',
      render: (value, row) => `KES ${value || 0} ${row?.unit || 'per unit'}`
    },
    { key: 'description', label: 'Description' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditRate(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteRate(row._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  const completionColumns = [
    {
      key: 'taskRate',
      label: 'Task',
      render: (value) => value?.taskName || 'N/A'
    },
    {
      key: 'orderId',
      label: 'Order',
      render: (value) => value?.orderNumber || 'N/A'
    },
    {
      key: 'quantityCompleted',
      label: 'Quantity'
    },
    {
      key: 'workersPresent',
      label: 'Workers',
      render: (value) => value?.length || 0
    },
    {
      key: 'totalPayment',
      label: 'Total Payment',
      render: (value) => `KES ${value?.toFixed(2) || '0.00'}`
    },
    {
      key: 'paymentPerWorker',
      label: 'Per Worker',
      render: (value) => `KES ${value?.toFixed(2) || '0.00'}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'verified' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'taskDate',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status !== 'verified' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleVerifyTask(row._id)}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const taskTypes = [
    { value: 'dispatch', label: 'Dispatch' },
    { value: 'loading', label: 'Loading' },
    { value: 'receiving', label: 'Receiving' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'setup', label: 'Setup' },
    { value: 'breakdown', label: 'Breakdown' },
    { value: 'delivery', label: 'Delivery' },
    { value: 'pickup', label: 'Pickup' }
  ];

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
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'rates'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <DollarSign className="h-4 w-4 inline mr-2" />
          Task Rates
        </button>
        <button
          onClick={() => setActiveTab('completions')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'completions'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-2" />
          Task Completions
        </button>
      </div>

      {/* Content */}
      {activeTab === 'rates' && (
        <DataTable
          data={ratesManager.data}
          columns={rateColumns}
          loading={ratesManager.loading}
          searchable={true}
          searchPlaceholder="Search task rates..."
        />
      )}

      {activeTab === 'completions' && (
        <DataTable
          data={completionsManager.data}
          columns={completionColumns}
          loading={completionsManager.loading}
          searchable={true}
          searchPlaceholder="Search task completions..."
        />
      )}

      {/* Add/Edit Task Rate Modal */}
      <FormModal
        isOpen={showAddRate}
        onClose={() => {
          setShowAddRate(false);
          setEditingRate(null);
          rateForm.reset();
        }}
        title={editingRate ? 'Edit Task Rate' : 'Add Task Rate'}
        onSubmit={editingRate ? handleUpdateRate : handleAddRate}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Type *
            </label>
            <select
              value={rateForm.values.taskType}
              onChange={(e) => rateForm.updateValues({ taskType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select task type...</option>
              {taskTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {rateForm.errors.taskType && (
              <p className="text-red-500 text-sm mt-1">{rateForm.errors.taskType}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name *
            </label>
            <input
              type="text"
              value={rateForm.values.taskName}
              onChange={(e) => rateForm.updateValues({ taskName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Chair Dispatch, Tent Setup"
            />
            {rateForm.errors.taskName && (
              <p className="text-red-500 text-sm mt-1">{rateForm.errors.taskName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate Per Unit *
            </label>
            <input
              type="number"
              step="0.01"
              value={rateForm.values.ratePerUnit}
              onChange={(e) => rateForm.updateValues({ ratePerUnit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
            {rateForm.errors.ratePerUnit && (
              <p className="text-red-500 text-sm mt-1">{rateForm.errors.ratePerUnit}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <input
              type="text"
              value={rateForm.values.unit}
              onChange={(e) => rateForm.updateValues({ unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., per chair, per tent, per load"
            />
            {rateForm.errors.unit && (
              <p className="text-red-500 text-sm mt-1">{rateForm.errors.unit}</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={rateForm.values.description}
            onChange={(e) => rateForm.updateValues({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Optional description of the task..."
          />
        </div>
      </FormModal>

      {/* Record Task Completion Modal */}
      <FormModal
        isOpen={showRecordTask}
        onClose={() => {
          setShowRecordTask(false);
          taskForm.reset();
          setSelectedWorkers([]);
        }}
        title="Record Task Completion"
        onSubmit={handleRecordTask}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Rate *
            </label>
            <select
              value={taskForm.values.taskRateId}
              onChange={(e) => taskForm.updateValues({ taskRateId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select task rate...</option>
              {ratesManager.data.map(rate => (
                <option key={rate._id} value={rate._id}>
                  {rate.taskName} (KES {rate.ratePerUnit} {rate.unit})
                </option>
              ))}
            </select>
            {taskForm.errors.taskRateId && (
              <p className="text-red-500 text-sm mt-1">{taskForm.errors.taskRateId}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order *
            </label>
            <select
              value={taskForm.values.orderId}
              onChange={(e) => taskForm.updateValues({ orderId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select order...</option>
              {orders.map(order => (
                <option key={order._id} value={order._id}>
                  {order.orderNumber} - {order.clientName}
                </option>
              ))}
            </select>
            {taskForm.errors.orderId && (
              <p className="text-red-500 text-sm mt-1">{taskForm.errors.orderId}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Completed *
            </label>
            <input
              type="number"
              value={taskForm.values.quantityCompleted}
              onChange={(e) => taskForm.updateValues({ quantityCompleted: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Number of items/units completed"
            />
            {taskForm.errors.quantityCompleted && (
              <p className="text-red-500 text-sm mt-1">{taskForm.errors.quantityCompleted}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Date
            </label>
            <input
              type="date"
              value={taskForm.values.taskDate}
              onChange={(e) => taskForm.updateValues({ taskDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workers Present *
          </label>
          <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
            {workers.map(worker => (
              <label key={worker._id} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  checked={selectedWorkers.includes(worker._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedWorkers([...selectedWorkers, worker._id]);
                    } else {
                      setSelectedWorkers(selectedWorkers.filter(id => id !== worker._id));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{worker.name}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Selected: {selectedWorkers.length} workers
          </p>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Description
          </label>
          <textarea
            value={taskForm.values.taskDescription}
            onChange={(e) => taskForm.updateValues({ taskDescription: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Optional description of the work done..."
          />
        </div>
      </FormModal>
    </div>
  );
};

export default TaskManagementPage;
