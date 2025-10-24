// src/components/orders/StatusDateStep.jsx
import React from 'react';
import { format } from 'date-fns';
import { statusOptions, getStatusLabel } from './utils/statusUtils';
import { formatDateForInput } from './utils/dateUtils';

const StatusDateStep = ({ 
  order, 
  statusData, 
  setStatusData, 
  calculations, 
  onCancel,
  onNext,
  availableStatuses 
}) => {
  const handleStatusChange = (value) => {
    setStatusData(prev => ({ 
      ...prev, 
      status: value,
      // Reset chargeable days when status changes
      chargeableDays: order.defaultChargeableDays || 1
    }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-gray-700">Step 1 of 2: Change Status & Set Date</p>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            New Status
          </label>
          <select
            id="status"
            value={statusData.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select status</option>
            {availableStatuses.map(status => {
              const option = statusOptions.find(opt => opt.value === status);
              return (
                <option key={status} value={status}>
                  {option?.label || status}
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="actualDate" className="block text-sm font-medium text-gray-700">
            Actual Date
          </label>
          <input
            id="actualDate"
            type="date"
            value={statusData.actualDate}
            onChange={(e) => setStatusData(prev => ({ ...prev, actualDate: e.target.value }))}
            // Use formatDateForInput to ensure correct min/max format from potential ISO strings
            min={order?.rentalStartDate ? formatDateForInput(order.rentalStartDate) : undefined}
            max={formatDateForInput(new Date().toISOString())}
            required
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500">
            Rental Period: {order?.rentalStartDate ? format(new Date(order.rentalStartDate), 'MMM d, yyyy') : 'N/A'} -{' '}
            {order?.rentalEndDate ? format(new Date(order.rentalEndDate), 'MMM d, yyyy') : 'N/A'}
          </p>
        </div>
      </div>

      {statusData.status === 'completed' && (
        <div className="space-y-2 p-4 border rounded-lg bg-yellow-50">
          <div className="flex items-center text-yellow-800">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Adjust Chargeable Days</span>
          </div>
          
          <input
            type="number"
            min="1"
            value={statusData.chargeableDays}
            onChange={(e) => setStatusData(prev => ({ 
              ...prev, 
              chargeableDays: Math.max(1, parseInt(e.target.value) || 1) 
            }))}
            className="w-full border border-yellow-300 rounded-lg p-2 mt-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          />
          
          {calculations && (
            <p className="mt-2 text-sm text-yellow-700">
              {calculations.isEarlyReturn ? (
                <span>Early return! Minimum 50% charge applies.</span>
              ) : calculations.isLateReturn ? (
                <span>Extended usage! Additional days charged at 150% rate.</span>
              ) : (
                <span>Standard rental period applied.</span>
              )}
            </p>
          )}
        </div>
      )}

      {calculations && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-2">Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-600">Current Status:</span>
            <span className="font-medium">{getStatusLabel(order.status)}</span>
            
            <span className="text-gray-600">New Status:</span>
            <span className="font-medium">{getStatusLabel(statusData.status)}</span>
            
            <span className="text-gray-600">Original Amount:</span>
            <span>KES {order.totalAmount?.toLocaleString() || 0}</span>
            
            {calculations.adjustedAmount !== undefined && (
              <>
                <span className="text-gray-600">Adjusted Amount:</span>
                <span className="font-bold text-indigo-700">
                  KES {calculations.adjustedAmount.toLocaleString()}
                </span>
                
                {calculations.difference !== 0 && (
                  <>
                    <span className="text-gray-600">Difference:</span>
                    <span className={calculations.difference > 0 ? 'text-red-600' : 'text-green-600'}>
                      {calculations.difference > 0 ? '+' : ''}
                      {calculations.difference.toLocaleString()}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!statusData.status || !statusData.actualDate}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Assign Workers
        </button>
      </div>
    </div>
  );
};

export default StatusDateStep;
