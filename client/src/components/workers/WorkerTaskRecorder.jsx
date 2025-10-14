import React, { useState } from 'react';
import { toast } from 'sonner';
import { workerTasksAPI } from '../../api/workerTasksAPI';
import Modal from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';

const WorkerTaskRecorder = ({
  isOpen,
  onClose,
  order,
  workers = [],
  taskType,
  taskLabel,
  suggestedAmount = 0,
  description = '',
  onTaskCreated
}) => {
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [taskAmount, setTaskAmount] = useState(suggestedAmount);
  const [notes, setNotes] = useState(description);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
    if (selectedWorkers.length === 0) {
      toast.error('Please select at least one worker');
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        order: order._id,
        taskType,
        taskAmount,
        notes,
        workers: selectedWorkers.map(worker => ({
          worker: worker._id,
          present: true
        }))
      };

      const result = await workerTasksAPI.tasks.create(taskData);
      toast.success('Worker task recorded successfully');
      
      if (onTaskCreated) {
        onTaskCreated(result);
      }
      
      onClose();
    } catch (error) {
      console.error('Error recording worker task:', error);
      toast.error(error.message || 'Failed to record worker task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record ${taskLabel || 'Worker Task'}`}
      description={`Order #${order._id?.slice(-6).toUpperCase()} - Select workers who participated`}
      size="medium"
    >
      <div className="space-y-4 py-4">
        {/* Task amount */}
        <div className="space-y-2">
          <Label htmlFor="taskAmount">Task Amount (KES)</Label>
          <Input
            id="taskAmount"
            type="number"
            min="0"
            value={taskAmount}
            onChange={(e) => setTaskAmount(Number(e.target.value))}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any relevant notes about this task"
            rows={3}
          />
        </div>

        {/* Worker selection */}
        <div className="space-y-2">
          <Label>Select Workers</Label>
          <p className="text-sm text-gray-500">
            Choose workers who participated in this task
          </p>
          
          <div className="max-h-60 overflow-y-auto border rounded-md p-2">
            {workers.length === 0 ? (
              <p className="text-sm text-gray-500 p-2">No workers available</p>
            ) : (
              <div className="space-y-2">
                {workers.map(worker => (
                  <div key={worker._id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`worker-${worker._id}`}
                      checked={selectedWorkers.some(w => w._id === worker._id)}
                      onCheckedChange={() => handleWorkerToggle(worker._id)}
                    />
                    <Label htmlFor={`worker-${worker._id}`} className="cursor-pointer">
                      {worker.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selectedWorkers.length === 0}>
            {loading ? 'Recording...' : 'Record Task'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WorkerTaskRecorder;