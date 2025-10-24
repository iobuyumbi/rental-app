import React from 'react';
import FormModal from '../common/FormModal';

const TaskCompletionForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
  errors,
  taskRates,
  orders,
  workers,
  selectedWorkers,
  setSelectedWorkers
}) => {
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onClose}
      title="Record Task Completion"
      description="Record task completion for orders or general maintenance tasks"
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Rate *
          </label>
          <select
            value={formData.taskRateId}
            onChange={(e) => onFormChange({ taskRateId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select task rate...</option>
            {taskRates.map(rate => (
              <option key={rate._id} value={rate._id}>
                {rate.taskName} (KES {rate.ratePerUnit} {rate.unit})
              </option>
            ))}
          </select>
          {errors.taskRateId && (
            <p className="text-red-500 text-sm mt-1">{errors.taskRateId}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order (Optional)
          </label>
          <select
            value={formData.orderId || ""}
            onChange={(e) => onFormChange({ orderId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No Order (General Task)</option>
            {orders && orders.length > 0 ? (
              orders.map(order => (
                <option key={order._id} value={order._id}>
                  {order.orderNumber} - {order.clientName}
                </option>
              ))
            ) : (
              <option value="" disabled>No orders available</option>
            )}
          </select>
          {errors.orderId && (
            <p className="text-red-500 text-sm mt-1">{errors.orderId}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity Completed *
          </label>
          <input
            type="number"
            value={formData.quantityCompleted}
            onChange={(e) => onFormChange({ quantityCompleted: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Number of items/units completed"
          />
          {errors.quantityCompleted && (
            <p className="text-red-500 text-sm mt-1">{errors.quantityCompleted}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Date
          </label>
          <input
            type="date"
            value={formData.taskDate}
            onChange={(e) => onFormChange({ taskDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Workers Present *
          </label>
          <button
            type="button"
            onClick={() => {
              // This would open a worker creation modal
              // For now, show a message
              alert('Worker creation feature coming soon! Please add workers in the Workers page first.');
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add New Worker
          </button>
        </div>
        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
          {workers && workers.length > 0 ? (
            workers.map(worker => (
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
          ))
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              No workers available. Please add workers first.
            </div>
          )}
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
          value={formData.taskDescription}
          onChange={(e) => onFormChange({ taskDescription: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Optional description of the work done..."
        />
      </div>
    </FormModal>
  );
};

export default TaskCompletionForm;
