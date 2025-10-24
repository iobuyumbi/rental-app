// src/components/orders/WorkerAssignmentStep.jsx
import React from 'react';

const WorkerAssignmentStep = ({ 
  statusData,
  calculations,
  selectedWorkers,
  availableWorkers,
  isLoadingWorkers,
  toggleWorkerPresence,
  addWorker,
  onBack,
  onSubmit,
  isSubmitting
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-gray-700">Step 2 of 2: Assign Workers</p>
      
      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
        <h3 className="font-bold text-blue-800">Order Summary</h3>
        <div className="grid grid-cols-2 gap-1 mt-2 text-sm">
          <span className="text-gray-600">Status:</span>
          <span className="font-medium capitalize">{statusData.status.replace('_', ' ')}</span>
          
          <span className="text-gray-600">Chargeable Days:</span>
          <span>{calculations?.calculatedDays || 0} days</span>
          
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-bold">KES {calculations?.adjustedAmount?.toLocaleString() || '0'}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">Assigned Workers</h4>
        
        {selectedWorkers.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No workers assigned yet</p>
        ) : (
          <div className="space-y-2">
            {selectedWorkers.map(worker => (
              <div key={worker._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id={`worker-${worker._id}`}
                    checked={worker.present}
                    onChange={() => toggleWorkerPresence(worker._id)}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <label htmlFor={`worker-${worker._id}`} className="flex-1">
                    <div className="font-medium">{worker.name}</div>
                    <div className="text-xs text-gray-500">{worker.role || 'Worker'}</div>
                  </label>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  worker.present 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {worker.present ? 'Present' : 'Absent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {availableWorkers.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Available Workers</h4>
          <div className="grid grid-cols-2 gap-2">
            {availableWorkers.map(worker => (
              <button
                key={worker._id}
                type="button"
                onClick={() => addWorker(worker)}
                className="flex items-center p-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="font-medium">{worker.name}</div>
                  <div className="text-xs text-gray-500">{worker.role || 'Worker'}</div>
                </div>
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoadingWorkers && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading workers...</span>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || selectedWorkers.filter(w => w.present).length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : (
            'Confirm & Update Status'
          )}
        </button>
      </div>
    </div>
  );
};

export default WorkerAssignmentStep;
