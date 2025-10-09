import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import StatusChangeModal from './StatusChangeModal';

/**
 * StatusButton - Clickable status button that opens modal for status changes
 * Handles date entry and chargeable days calculation
 */
const StatusButton = ({ 
  order, 
  onStatusChange,
  disabled = false 
}) => {
  const [showModal, setShowModal] = useState(false);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'in_progress': return 'outline';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handleClick = () => {
    if (!disabled) {
      setShowModal(true);
    }
  };

  const handleStatusChange = async (statusData) => {
    try {
      await onStatusChange(order._id, statusData);
      setShowModal(false);
    } catch (error) {
      console.error('Error changing status:', error);
      // Modal will handle error display
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={`px-3 py-1 h-auto font-medium transition-colors ${getStatusColor(order.status)} ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        }`}
        onClick={handleClick}
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          {order.status === 'in_progress' && <Clock className="h-3 w-3" />}
          {order.status === 'completed' && <DollarSign className="h-3 w-3" />}
          {order.status === 'confirmed' && <Calendar className="h-3 w-3" />}
          {formatStatus(order.status)}
        </div>
      </Button>

      {showModal && (
        <StatusChangeModal
          isOpen={showModal}
          order={order}
          onStatusChange={handleStatusChange}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default StatusButton;
