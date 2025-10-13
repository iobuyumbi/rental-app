import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Calendar, 
  DollarSign, 
  User, 
  Package, 
  Phone, 
  Mail,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock
} from 'lucide-react';
import StatusButton from '../orders/StatusButton';

const MobileOrderCard = ({ order, onStatusChange, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDuration = () => {
    const start = new Date(order.rentalStartDate);
    const end = new Date(order.rentalEndDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <Card className="w-full mb-4 shadow-sm border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg truncate">
                #{order._id?.slice(-6).toUpperCase()}
              </h3>
              <Badge className={getStatusColor(order.status)}>
                {order.status?.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{order.client?.name || 'Unknown Client'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">KES {order.totalAmount?.toLocaleString() || '0'}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 ml-2">
            <StatusButton 
              order={order} 
              onStatusChange={onStatusChange}
              size="sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Rental Period */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Rental Period:</span>
            </div>
            <div className="ml-6 text-sm">
              <div className="flex items-center justify-between">
                <span>Start: {formatDate(order.rentalStartDate)}</span>
                <Clock className="h-3 w-3 text-gray-400" />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span>End: {formatDate(order.rentalEndDate)}</span>
                <span className="text-xs text-gray-500">({getDuration()})</span>
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Client Details:</span>
            </div>
            <div className="ml-6 space-y-2 text-sm">
              {order.client?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <a href={`tel:${order.client.phone}`} className="text-blue-600">
                    {order.client.phone}
                  </a>
                </div>
              )}
              {order.client?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <a href={`mailto:${order.client.email}`} className="text-blue-600 truncate">
                    {order.client.email}
                  </a>
                </div>
              )}
              {order.client?.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 text-gray-400 mt-0.5" />
                  <span className="text-gray-700 text-xs leading-relaxed">
                    {order.client.address}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Items ({order.items?.length || 0}):</span>
            </div>
            <div className="ml-6 space-y-2">
              {order.items?.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {item.product?.name || item.name || 'Unknown Item'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Qty: {item.quantity} × KES {item.unitPrice?.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="font-medium text-sm">
                      KES {item.totalPrice?.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {order.items?.length > 3 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{order.items.length - 3} more items
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="space-y-2 mb-4">
              <div className="text-sm text-gray-600">Notes:</div>
              <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded text-xs leading-relaxed">
                {order.notes}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit?.(order)}
              className="flex-1"
            >
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete?.(order)}
              className="flex-1 text-red-600 hover:text-red-700"
            >
              Delete
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default MobileOrderCard;
