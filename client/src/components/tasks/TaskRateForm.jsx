import React from 'react';
import FormModal from '../common/FormModal';

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

const TaskRateForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
  errors, 
  editingRate 
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRate ? 'Edit Task Rate' : 'Add Task Rate'}
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Type *
          </label>
          <select
            value={formData.taskType}
            onChange={(e) => onFormChange({ taskType: e.target.value })}
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
          {errors.taskType && (
            <p className="text-red-500 text-sm mt-1">{errors.taskType}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Name *
          </label>
          <input
            type="text"
            value={formData.taskName}
            onChange={(e) => onFormChange({ taskName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Chair Dispatch, Tent Setup"
          />
          {errors.taskName && (
            <p className="text-red-500 text-sm mt-1">{errors.taskName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate Per Unit *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.ratePerUnit}
            onChange={(e) => onFormChange({ ratePerUnit: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
          {errors.ratePerUnit && (
            <p className="text-red-500 text-sm mt-1">{errors.ratePerUnit}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit *
          </label>
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => onFormChange({ unit: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., per chair, per tent, per load"
          />
          {errors.unit && (
            <p className="text-red-500 text-sm mt-1">{errors.unit}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Effective Date *
          </label>
          <input
            type="date"
            value={formData.effectiveDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => onFormChange({ effectiveDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {errors.effectiveDate && (
            <p className="text-red-500 text-sm mt-1">{errors.effectiveDate}</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Optional description of the task..."
        />
      </div>
    </FormModal>
  );
};

export default TaskRateForm;
