import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { AlertTriangle } from 'lucide-react';

/**
 * StatusDateSelectionStep - Extracted component for status and date selection
 * Handles status selection, date input, and chargeable days with real-time calculations
 */
const StatusDateSelectionStep = ({
  order,
  statusData,
  onStatusDataChange,
  availableStatuses,
  calculations
}) => {
  const handleInputChange = (field, value) => {
    onStatusDataChange({
      ...statusData,
      [field]: value
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'confirmed': 'bg-blue-50 text-blue-700 border-blue-200',
      'in_progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'completed': 'bg-green-50 text-green-700 border-green-200',
      'cancelled': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      {/* Current Order Info */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Order Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Current Status:</span>
            <Badge className={`ml-2 ${getStatusColor(order?.status)}`}>
              {order?.status?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Order Total:</span>
            <span className="ml-2 font-bold">KES {order?.totalAmount?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Status Selection */}
      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">New Status</Label>
        <Select value={statusData.status} onValueChange={(value) => handleInputChange('status', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select new status" />
          </SelectTrigger>
          <SelectContent>
            {availableStatuses.map(status => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center">
                  <Badge className={`mr-2 ${getStatusColor(status)}`} variant="outline">
                    {status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Input - Show for completed status */}
      {statusData.status === 'completed' && (
        <div className="space-y-2">
          <Label htmlFor="actualDate" className="text-sm font-medium">Actual Return Date</Label>
          <Input
            id="actualDate"
            type="date"
            value={statusData.actualDate}
            onChange={(e) => handleInputChange('actualDate', e.target.value)}
            className="w-full"
          />
        </div>
      )}

      {/* Chargeable Days */}
      <div className="space-y-2">
        <Label htmlFor="chargeableDays" className="text-sm font-medium">Chargeable Days</Label>
        <Input
          id="chargeableDays"
          type="number"
          min="1"
          value={statusData.chargeableDays}
          onChange={(e) => handleInputChange('chargeableDays', parseInt(e.target.value) || 1)}
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Number of days to charge for this rental period
        </p>
      </div>

      {/* Financial Impact Display */}
      {calculations && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            Financial Impact
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Original Amount:</span>
              <span className="font-medium">KES {calculations.originalAmount?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Adjusted Amount:</span>
              <span className={`font-bold ${
                calculations.adjustedAmount > calculations.originalAmount 
                  ? 'text-red-600' 
                  : calculations.adjustedAmount < calculations.originalAmount 
                    ? 'text-green-600' 
                    : 'text-gray-800'
              }`}>
                KES {calculations.adjustedAmount?.toLocaleString() || 0}
              </span>
            </div>
            {calculations.adjustedAmount !== calculations.originalAmount && (
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">
                  {calculations.adjustedAmount > calculations.originalAmount ? 'Additional Charge:' : 'Refund:'}
                </span>
                <span className={`font-bold ${
                  calculations.adjustedAmount > calculations.originalAmount ? 'text-red-600' : 'text-green-600'
                }`}>
                  KES {Math.abs(calculations.adjustedAmount - calculations.originalAmount).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusDateSelectionStep;
