import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChevronDown } from 'lucide-react';
import OrderStatusManager from './OrderStatusManager';

/**
 * StatusButton - A button component for changing order status
 * Provides a modal interface for status changes
 */
const StatusButton = ({ order, onStatusChange, disabled = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { value: 'completed', label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-50 text-gray-700 border-gray-200' }
  ];

  const currentStatus = statusOptions.find(s => s.value === order?.status) || statusOptions[0];

  const handleStatusUpdate = (orderId, updateData) => {
    if (onStatusChange) {
      onStatusChange(orderId, updateData);
    }
  };

  if (disabled) {
    return (
      <Badge className={currentStatus.color}>
        {currentStatus.label}
      </Badge>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className={`${currentStatus.color} hover:opacity-80`}
        disabled={disabled}
      >
        {currentStatus.label}
        <ChevronDown className="ml-1 h-3 w-3" />
      </Button>

      <OrderStatusManager
        order={order}
        onStatusChange={handleStatusUpdate}
        onComplete={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
    );
};

export default StatusButton;
