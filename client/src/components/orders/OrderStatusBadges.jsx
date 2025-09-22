import React from 'react';
import { Badge } from '../ui/badge';

export const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'confirmed': return 'default';
    case 'in_progress': return 'outline';
    case 'completed': return 'default';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

export const getPaymentStatusBadgeVariant = (status) => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'partial': return 'outline';
    case 'paid': return 'default';
    case 'refunded': return 'destructive';
    default: return 'secondary';
  }
};

const OrderStatusBadges = ({ order }) => {
  return (
    <div className="space-y-1">
      <Badge variant={getStatusBadgeVariant(order.status)}>
        {order.status}
      </Badge>
      <div>
        <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)} className="text-xs">
          {order.paymentStatus}
        </Badge>
      </div>
    </div>
  );
};

export default OrderStatusBadges;
