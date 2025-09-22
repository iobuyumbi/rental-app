import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, Search, DollarSign } from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { toast } from 'sonner';

const ViolationForm = ({
  isOpen,
  onClose,
  violation = null,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    orderId: '',
    violationType: '',
    description: '',
    penaltyAmount: 0,
    dueDate: '',
    priority: 'medium',
    notes: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const violationTypes = [
    { value: 'Overdue Return', label: 'Overdue Return', penalty: 500 },
    { value: 'Damaged Item', label: 'Damaged Item', penalty: 1000 },
    { value: 'Missing Item', label: 'Missing Item', penalty: 2000 },
    { value: 'Late Payment', label: 'Late Payment', penalty: 200 },
    { value: 'Contract Violation', label: 'Contract Violation', penalty: 1500 }
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    if (violation) {
      setFormData({
        orderId: violation.orderId || '',
        violationType: violation.violationType || '',
        description: violation.description || '',
        penaltyAmount: violation.penaltyAmount || 0,
        dueDate: violation.dueDate ? new Date(violation.dueDate).toISOString().split('T')[0] : '',
        priority: violation.priority || 'medium',
        notes: violation.notes || ''
      });
      
      if (violation.order) {
        setSelectedOrder(violation.order);
      }
    } else {
      // Reset form for new violation
      setFormData({
        orderId: '',
        violationType: '',
        description: '',
        penaltyAmount: 0,
        dueDate: '',
        priority: 'medium',
        notes: ''
      });
      setSelectedOrder(null);
    }
  }, [violation]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViolationTypeChange = (type) => {
    const violationType = violationTypes.find(vt => vt.value === type);
    handleInputChange('violationType', type);
    
    // Auto-set penalty amount based on violation type
    if (violationType && !formData.penaltyAmount) {
      handleInputChange('penaltyAmount', violationType.penalty);
    }
    
    // Auto-generate description template
    if (selectedOrder && violationType) {
      const template = generateDescriptionTemplate(type, selectedOrder);
      handleInputChange('description', template);
    }
  };

  const generateDescriptionTemplate = (type, order) => {
    const clientName = order.client?.name || 'Client';
    const orderId = order._id?.slice(-8) || 'N/A';
    
    switch (type) {
      case 'Overdue Return':
        return `${clientName} has failed to return rented items from Order #${orderId} by the due date.`;
      case 'Damaged Item':
        return `Items from Order #${orderId} were returned in damaged condition by ${clientName}.`;
      case 'Missing Item':
        return `${clientName} failed to return all items from Order #${orderId}. Items are missing.`;
      case 'Late Payment':
        return `Payment for Order #${orderId} was not received on time from ${clientName}.`;
      case 'Contract Violation':
        return `${clientName} violated rental terms and conditions for Order #${orderId}.`;
      default:
        return '';
    }
  };

  const searchOrders = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const orders = await ordersAPI.getOrders({ search: query, status: 'active' });
      setSearchResults(orders.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Error searching orders:', error);
      toast.error('Failed to search orders');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    setFormData(prev => ({ ...prev, orderId: order._id }));
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOrder) {
      toast.error('Please select an order');
      return;
    }

    const submissionData = {
      ...formData,
      orderId: selectedOrder._id,
      clientId: selectedOrder.client?._id
    };

    await onSubmit(submissionData);
  };

  const calculateDueDate = () => {
    if (formData.violationType === 'Overdue Return' && selectedOrder) {
      const returnDate = new Date(selectedOrder.returnDate);
      return returnDate.toISOString().split('T')[0];
    }
    return '';
  };

  useEffect(() => {
    if (formData.violationType === 'Overdue Return' && selectedOrder && !formData.dueDate) {
      const dueDate = calculateDueDate();
      if (dueDate) {
        handleInputChange('dueDate', dueDate);
      }
    }
  }, [formData.violationType, selectedOrder]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {violation ? 'Edit Violation' : 'Create New Violation'}
          </DialogTitle>
          <DialogDescription>
            {violation ? 'Update violation details and penalty information' : 'Create a new violation record for a rental order'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Selection */}
          <div className="space-y-2">
            <Label>Select Order</Label>
            {selectedOrder ? (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-medium">Order #{selectedOrder._id?.slice(-8)}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.client?.name}</p>
                      <p className="text-xs text-gray-500">
                        {selectedOrder.items?.length} items • Due: {new Date(selectedOrder.returnDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(null);
                        handleInputChange('orderId', '');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by order ID, client name, or phone..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchOrders(e.target.value);
                    }}
                    className="pl-10"
                  />
                </div>
                
                {searchLoading && (
                  <p className="text-sm text-gray-500">Searching...</p>
                )}
                
                {searchResults.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {searchResults.map((order) => (
                      <div
                        key={order._id}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleOrderSelect(order)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">Order #{order._id?.slice(-8)}</p>
                            <p className="text-sm text-gray-600">{order.client?.name}</p>
                            <p className="text-xs text-gray-500">
                              {order.items?.length} items • Due: {new Date(order.returnDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline" className={
                            order.status === 'Overdue' ? 'bg-red-100 text-red-800' : 
                            order.status === 'Active' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Violation Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="violationType">Violation Type</Label>
              <Select
                value={formData.violationType}
                onValueChange={handleViolationTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select violation type" />
                </SelectTrigger>
                <SelectContent>
                  {violationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex justify-between items-center w-full">
                        <span>{type.label}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          KES {type.penalty.toLocaleString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority Level</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={level.color} variant="outline">
                          {level.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Penalty and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="penaltyAmount">Penalty Amount (KES)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="penaltyAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.penaltyAmount}
                  onChange={(e) => handleInputChange('penaltyAmount', parseFloat(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the violation in detail..."
              rows={3}
              required
            />
          </div>

          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information or context..."
              rows={2}
            />
          </div>

          {/* Summary */}
          {selectedOrder && formData.violationType && (
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Violation Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Client:</span>
                      <span className="ml-2 font-medium">{selectedOrder.client?.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Order:</span>
                      <span className="ml-2 font-medium">#{selectedOrder._id?.slice(-8)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium">{formData.violationType}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Penalty:</span>
                      <span className="ml-2 font-medium text-red-600">
                        KES {formData.penaltyAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading || !selectedOrder || !formData.violationType}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Saving...' : (violation ? 'Update Violation' : 'Create Violation')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ViolationForm;
