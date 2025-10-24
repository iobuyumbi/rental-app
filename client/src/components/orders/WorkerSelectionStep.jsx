import React from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Loader2, PlusCircle } from 'lucide-react';

/**
 * WorkerSelectionStep - Extracted component for worker selection in status changes
 * Handles both assigned workers and available workers for assignment
 */
const WorkerSelectionStep = ({
  selectedWorkers,
  availableWorkers,
  isLoadingWorkers,
  onToggleWorkerPresence,
  onAddWorker,
  calculations
}) => {
  // Filter out workers that are already selected
  const workersToAssign = availableWorkers.filter(
    worker => !selectedWorkers.some(selected => selected._id === worker._id)
  );

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="bg-gray-100 p-3 rounded-lg border-l-4 border-blue-500">
        <p className="text-sm font-medium">
          Total: <span className="font-extrabold text-indigo-700">
            KES {calculations?.adjustedAmount?.toLocaleString() || 0}
          </span>
        </p>
      </div>

      {/* Currently selected workers */}
      <div className="space-y-3 max-h-60 overflow-y-auto border p-3 rounded-lg bg-white shadow-inner">
        <h4 className="font-bold text-sm text-gray-800">Assigned Workers for this Task</h4>
        {selectedWorkers.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No workers are currently assigned to this status change task.
          </p>
        ) : (
          selectedWorkers.map((worker, index) => (
            <div 
              key={worker._id || index} 
              className="flex items-center justify-between space-x-2 p-2 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`worker-${worker._id}`}
                  checked={worker.present}
                  onCheckedChange={() => onToggleWorkerPresence(worker._id)}
                />
                <Label htmlFor={`worker-${worker._id}`} className="flex-1 cursor-pointer font-medium">
                  {worker.name}
                  <span className="text-xs ml-2 text-gray-500">({worker.role || 'Worker'})</span>
                </Label>
              </div>
              <Badge variant={worker.present ? 'default' : 'destructive'} className="text-[10px] h-4">
                {worker.present ? 'Present' : 'Absent'}
              </Badge>
            </div>
          ))
        )}
      </div>

      {/* Available workers from database */}
      <div className="space-y-3 max-h-48 overflow-y-auto border p-3 rounded-lg">
        <h4 className="font-bold text-sm text-gray-800">Add Available Workers</h4>
        {isLoadingWorkers ? (
          <div className="flex items-center text-sm text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 
            Loading workers...
          </div>
        ) : workersToAssign.length === 0 ? (
          <p className="text-sm text-gray-500 italic">All available workers are listed above.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {workersToAssign.map(worker => (
              <Button
                key={worker._id}
                variant="outline"
                className="flex items-center justify-between p-2 text-left h-auto"
                onClick={() => onAddWorker(worker)}
              >
                <span className="truncate">{worker.name}</span>
                <PlusCircle className="h-4 w-4 ml-2 text-indigo-500" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerSelectionStep;
