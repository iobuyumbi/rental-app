import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Users, Clock, DollarSign, Edit, Trash2 } from 'lucide-react';
import { workerTasksAPI } from '../../api/workerTasksAPI';
import { formatDate, formatCurrency } from '../../utils/formatters';

const OrderTaskHistory = ({ 
  order, 
  onEditTask,
  onDeleteTask,
  refreshTrigger = 0 
}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Task type labels for display
  const taskTypeLabels = {
    arranging_pickup: 'Arranging for Pickup',
    issuing: 'Issuing Items',
    loading: 'Loading Vehicle',
    transport: 'Transport/Delivery',
    unloading: 'Unloading at Site',
    receiving: 'Receiving Returns',
    loading_returns: 'Loading Returns',
    transport_returns: 'Transport Returns',
    unloading_returns: 'Unloading Returns',
    storing: 'Storing Items'
  };

  // Task phase mapping
  const taskPhases = {
    arranging_pickup: 'pickup',
    issuing: 'pickup',
    loading: 'pickup',
    transport: 'pickup',
    unloading: 'pickup',
    receiving: 'return',
    loading_returns: 'return',
    transport_returns: 'return',
    unloading_returns: 'return',
    storing: 'return'
  };

  // Phase colors
  const phaseColors = {
    pickup: 'bg-blue-100 text-blue-800',
    return: 'bg-green-100 text-green-800'
  };

  useEffect(() => {
    if (order?._id) {
      fetchOrderTasks();
    }
  }, [order?._id, refreshTrigger]);

  const fetchOrderTasks = async () => {
    try {
      setLoading(true);
      // Check if workerTasksAPI and the tasks.list method exist
      if (!workerTasksAPI || !workerTasksAPI.tasks || !workerTasksAPI.tasks.list) {
        console.warn('workerTasksAPI.tasks.list is not available');
        setTasks([]);
        return;
      }
      
      const response = await workerTasksAPI.tasks.list({ orderId: order._id });
      const tasksData = response?.data || response || [];
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error) {
      console.error('Error fetching order tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task) => {
    if (onEditTask) {
      onEditTask(task);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task record?')) return;
    
    try {
      if (onDeleteTask) {
        await onDeleteTask(taskId);
      }
      // Refresh the task list
      fetchOrderTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500">Loading task history...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500 text-sm">
        No worker tasks recorded for this order yet.
      </div>
    );
  }

  // Group tasks by phase
  const pickupTasks = tasks.filter(task => taskPhases[task.taskType] === 'pickup');
  const returnTasks = tasks.filter(task => taskPhases[task.taskType] === 'return');

  const renderTaskGroup = (groupTasks, phase, title) => {
    if (groupTasks.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${phase === 'pickup' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
          <h5 className="font-medium text-gray-800">{title}</h5>
          <Badge variant="secondary" className="text-xs">
            {groupTasks.length} task{groupTasks.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="space-y-2">
          {groupTasks.map((task) => (
            <div key={task._id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={phaseColors[phase]}>
                      {taskTypeLabels[task.taskType] || task.taskType}
                    </Badge>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(task.taskAmount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-600 mb-2">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(task.completedAt || task.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>
                        {task.workers?.filter(w => w.present).length || 0} workers
                      </span>
                    </div>
                  </div>

                  {/* Present Workers */}
                  <div className="flex flex-wrap gap-1">
                    {task.workers?.filter(w => w.present).map((workerEntry, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {workerEntry.worker?.name || 'Unknown Worker'}
                      </Badge>
                    ))}
                  </div>

                  {/* Notes */}
                  {task.notes && (
                    <div className="mt-2 text-xs text-gray-600 italic">
                      "{task.notes}"
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditTask(task)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTask(task._id)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold">Recorded Worker Tasks</h4>
        <div className="text-sm text-gray-500">
          Total: {formatCurrency(tasks.reduce((sum, task) => sum + task.taskAmount, 0))}
        </div>
      </div>

      {renderTaskGroup(pickupTasks, 'pickup', 'Pickup & Delivery Phase')}
      {renderTaskGroup(returnTasks, 'return', 'Return & Storage Phase')}
    </div>
  );
};

export default OrderTaskHistory;
