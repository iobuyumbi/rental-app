// client/src/components/orders/EnhancedOrderStatusManager/utils/statusFlowUtils.js

/**
 * Defines the canonical list of order status options, including user-friendly labels.
 * The 'value' should match the backend status field.
 */
export const statusOptions = [
  { value: 'pending', label: 'Pending (Awaiting Confirmation)' },
  { value: 'confirmed', label: 'Confirmed (Ready to Deploy)' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'in_use', label: 'In Use / In Progress' },
  { value: 'return_scheduled', label: 'Return Scheduled' },
  { value: 'completed', label: 'Completed (Items Returned)' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Determines the next valid status transitions from the current status.
 * This defines the required order workflow.
 * @param {string} currentStatus - The current status of the order.
 * @returns {string[]} An array of valid next status values.
 */
export const getAvailableStatuses = (currentStatus) => {
  const flow = (currentStatus || '').toLowerCase();
  
  // Define the permitted transitions for a comprehensive rental/service order
  const statusFlow = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['out_for_delivery', 'cancelled'],
    'out_for_delivery': ['delivered', 'cancelled'],
    'delivered': ['in_use', 'return_scheduled', 'completed', 'cancelled'], // Can skip to complete or schedule return
    'in_use': ['return_scheduled', 'completed', 'cancelled'],
    'return_scheduled': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };
  
  // Default to empty array if status is unknown or final
  return statusFlow[flow] || [];
};

/**
 * Gets the user-friendly label for a given status value.
 * @param {string} statusValue - The machine-readable status value.
 * @returns {string} The display label.
 */
export const getStatusLabel = (statusValue) => {
  if (!statusValue) return 'N/A';
  const option = statusOptions.find(opt => opt.value === statusValue);
  // Fallback: If not found, clean up the snake_case string for display
  return option ? option.label : statusValue.replace(/_/g, ' ').toUpperCase();
};

/**
 * Gets the machine-readable value for a given status label.
 * This is primarily useful if working backwards from a display value (less common).
 * @param {string} statusLabel - The user-friendly status label.
 * @returns {string} The machine-readable value.
 */
export const getStatusValue = (statusLabel) => {
  const option = statusOptions.find(opt => opt.label === statusLabel);
  // Fallback: lowercase and replace spaces with underscores
  return option ? option.value : statusLabel.toLowerCase().replace(/\s/g, '_');
};
