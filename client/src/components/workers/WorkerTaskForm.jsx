import React, { useState, useEffect } from 'react';
import { useForm } from '../../hooks/useForm';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { FormModal } from '../ui/FormModal';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { FormTextarea } from '../ui/FormTextarea';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { workersAPI } from '../../api/workersAPI';
import { ordersAPI } from '../../api/ordersAPI';

const WorkerTaskForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { formData, errors, handleInputChange, updateValues, validateForm, setErrors } = useForm(
    {
      orderId: initialData?.order?._id || '',
      taskType: initialData?.taskType || 'issuing',
      taskAmount: initialData?.taskAmount || '',
      notes: initialData?.notes || ''
    },
    {
      orderId: { required: true },
      taskType: { required: true },
      taskAmount: { required: true }
    }
  );

  // Load workers on component mount
  useEffect(() => {
    const loadWorkers = async () => {
      try {
        const response = await workersAPI.workers.list();
        setWorkers(response.data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load workers',
          variant: 'destructive'
        });
      }
    };

    loadWorkers();
  }, [toast]);

  // Initialize selected workers if editing
  useEffect(() => {
    if (initialData && initialData.workers) {
      setSelectedWorkers(initialData.workers.map(w => ({
        worker: w.worker._id,
        workerName: w.worker.name,
        present: w.present
      })));
    }
  }, [initialData]);

  // Initialize selected order if editing
  useEffect(() => {
    if (initialData && initialData.order) {
      setSelectedOrder(initialData.order);
    }
  }, [initialData]);

  const searchOrders = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await ordersAPI.orders.search(query);
      setSearchResults(response.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search orders',
        variant: 'destructive'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    handleInputChange('orderId', order._id);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleWorkerToggle = (workerId, workerName) => {
    const workerIndex = selectedWorkers.findIndex(w => w.worker === workerId);
    
    if (workerIndex === -1) {
      // Add worker
      setSelectedWorkers([
        ...selectedWorkers,
        { worker: workerId, workerName, present: true }
      ]);
    } else {
      // Remove worker
      const updatedWorkers = [...selectedWorkers];
      updatedWorkers.splice(workerIndex, 1);
      setSelectedWorkers(updatedWorkers);
    }
  };

  const handlePresenceToggle = (workerId) => {
    const updatedWorkers = selectedWorkers.map(w => {
      if (w.worker === workerId) {
        return { ...w, present: !w.present };
      }
      return w;
    });
    setSelectedWorkers(updatedWorkers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Validate workers
    if (selectedWorkers.length === 0) {
      setErrors(prev => ({ ...prev, workers: 'At least one worker is required' }));
      return;
    }

    // Format data for submission
    const taskData = {
      orderId: formData.orderId,
      taskType: formData.taskType,
      taskAmount: parseFloat(formData.taskAmount),
      notes: formData.notes,
      workers: selectedWorkers.map(w => ({
        worker: w.worker,
        present: w.present
      }))
    };

    onSubmit(taskData);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Worker Task' : 'Record Worker Task'}
      description="Record workers present during order tasks"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Order Information</h3>
          
          {selectedOrder ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Order #{selectedOrder._id.slice(-6).toUpperCase()}</h4>
                    <p className="text-sm text-gray-500">
                      {selectedOrder.client?.name || 'Unknown Client'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedOrder.items?.length || 0} items • {new Date(selectedOrder.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(null);
                      handleInputChange('orderId', '');
                    }}
                  >
                    Change
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by order ID, client name, or phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchOrders(e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
              
              {searchLoading && (
                <p className="text-sm text-gray-500">Searching...</p>
              )}
              
              {searchResults.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto">
                  {searchResults.map((order) => (
                    <div
                      key={order._id}
                      className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleOrderSelect(order)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">Order #{order._id.slice(-6).toUpperCase()}</p>
                          <p className="text-sm">{order.client?.name || 'Unknown Client'}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery && searchResults.length === 0 && !searchLoading && (
                <p className="text-sm text-gray-500">No orders found</p>
              )}
              
              {errors.orderId && (
                <p className="text-sm text-red-500">{errors.orderId}</p>
              )}
            </div>
          )}
        </div>

        {/* Task Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Task Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Task Type"
              name="taskType"
              value={formData.taskType}
              onChange={(e) => handleInputChange('taskType', e.target.value)}
              error={errors.taskType}
              options={[
                { value: 'issuing', label: 'Issuing Items' },
                { value: 'receiving', label: 'Receiving Items' },
                { value: 'loading', label: 'Loading' },
                { value: 'unloading', label: 'Unloading' },
                { value: 'other', label: 'Other Task' }
              ]}
            />
            
            <FormInput
              label="Task Amount (KES)"
              name="taskAmount"
              type="number"
              value={formData.taskAmount}
              onChange={(e) => handleInputChange('taskAmount', e.target.value)}
              error={errors.taskAmount}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          
          <FormTextarea
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            error={errors.notes}
            placeholder="Additional details about this task"
          />
        </div>

        {/* Worker Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Workers Present</h3>
          
          {errors.workers && (
            <p className="text-sm text-red-500">{errors.workers}</p>
          )}
          
          <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
            {workers.length === 0 ? (
              <p className="text-sm text-gray-500">No workers found</p>
            ) : (
              <div className="space-y-2">
                {workers.map((worker) => {
                  const isSelected = selectedWorkers.some(w => w.worker === worker._id);
                  const isPresent = selectedWorkers.find(w => w.worker === worker._id)?.present || false;
                  
                  return (
                    <div key={worker._id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`worker-${worker._id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleWorkerToggle(worker._id, worker.name)}
                        />
                        <label
                          htmlFor={`worker-${worker._id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {worker.name}
                        </label>
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Present:</span>
                          <Checkbox
                            id={`present-${worker._id}`}
                            checked={isPresent}
                            onCheckedChange={() => handlePresenceToggle(worker._id)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {selectedWorkers.length > 0 && (
            <div className="p-2 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">Selected Workers: {selectedWorkers.length}</p>
              <p className="text-sm text-gray-500">
                Present: {selectedWorkers.filter(w => w.present).length} / {selectedWorkers.length}
              </p>
              {selectedWorkers.filter(w => w.present).length > 0 && formData.taskAmount && (
                <p className="text-sm text-gray-500">
                  Share per worker: KES {(parseFloat(formData.taskAmount) / selectedWorkers.filter(w => w.present).length).toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update' : 'Save'} Task
          </Button>
        </div>
      </form>
    </FormModal>
  );
};

export default WorkerTaskForm;