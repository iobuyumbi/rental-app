import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  User, 
  Calendar,
  FileText,
  Phone,
  Mail,
  MapPin,
  Package,
  Edit,
  Trash2
} from 'lucide-react';

const ViolationDetailsModal = ({
  isOpen,
  onClose,
  violation,
  onEdit,
  onDelete,
  onResolve,
  canEdit = true
}) => {
  if (!violation) return null;

  const getViolationTypeColor = (type) => {
    switch (type) {
      case 'Overdue Return':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Damaged Item':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Missing Item':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Late Payment':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Contract Violation':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysOverdue = () => {
    if (!violation.dueDate || violation.resolved) return null;
    const dueDate = new Date(violation.dueDate);
    const today = new Date();
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const daysOverdue = getDaysOverdue();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Violation Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this rental violation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Actions Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {violation.resolved ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Resolved</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Pending</span>
                </div>
              )}
              
              {daysOverdue && (
                <Badge variant="destructive">
                  {daysOverdue} days overdue
                </Badge>
              )}
            </div>

            {canEdit && !violation.resolved && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(violation)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => onResolve(violation)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
              </div>
            )}
          </div>

          {/* Main Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Violation Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Violation Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <Badge className={getViolationTypeColor(violation.violationType)} variant="outline">
                      {violation.violationType}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <Badge className={getPriorityColor(violation.priority)} variant="outline">
                      {violation.priority?.toUpperCase() || 'MEDIUM'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm mt-1">{violation.description}</p>
                </div>

                {violation.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Additional Notes</label>
                    <p className="text-sm mt-1 text-gray-600">{violation.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created Date</label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(violation.createdAt)}
                    </p>
                  </div>
                  {violation.dueDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Due Date</label>
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(violation.dueDate)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client and Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Client & Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client Info */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Client</label>
                  <div className="mt-1 space-y-1">
                    <p className="font-medium">{violation.order?.client?.name || violation.clientName || 'Unknown Client'}</p>
                    {violation.order?.client?.email && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {violation.order.client.email}
                      </p>
                    )}
                    {violation.order?.client?.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {violation.order.client.phone}
                      </p>
                    )}
                    {violation.order?.client?.address && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {violation.order.client.address}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Order Info */}
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Details</label>
                  <div className="mt-1 space-y-2">
                    <p className="font-medium">
                      Order #{violation.order?._id?.slice(-8) || violation.orderId?.slice(-8) || 'N/A'}
                    </p>
                    
                    {violation.order && (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Start Date:</span>
                            <p>{new Date(violation.order.startDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Return Date:</span>
                            <p>{new Date(violation.order.returnDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Amount:</span>
                            <p className="font-medium">KES {violation.order.totalAmount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            <Badge variant="outline">{violation.order.status}</Badge>
                          </div>
                        </div>

                        {violation.order.items && violation.order.items.length > 0 && (
                          <div>
                            <span className="text-gray-500 text-sm">Items ({violation.order.items.length}):</span>
                            <div className="mt-1 space-y-1">
                              {violation.order.items.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <Package className="h-3 w-3" />
                                  <span>{item.product?.name || item.name} × {item.quantity}</span>
                                </div>
                              ))}
                              {violation.order.items.length > 3 && (
                                <p className="text-xs text-gray-500">
                                  +{violation.order.items.length - 3} more items
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Penalty Amount</p>
                  <p className="text-2xl font-bold text-red-600">
                    KES {violation.penaltyAmount?.toLocaleString() || '0'}
                  </p>
                </div>
                
                {violation.paidAmount && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      KES {violation.paidAmount.toLocaleString()}
                    </p>
                  </div>
                )}
                
                {violation.waivedAmount && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Amount Waived</p>
                    <p className="text-2xl font-bold text-blue-600">
                      KES {violation.waivedAmount.toLocaleString()}
                    </p>
                  </div>
                )}
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Outstanding</p>
                  <p className="text-2xl font-bold text-gray-800">
                    KES {((violation.penaltyAmount || 0) - (violation.paidAmount || 0) - (violation.waivedAmount || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Information */}
          {violation.resolved && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Resolution Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Resolved Date</label>
                    <p className="text-sm mt-1">{formatDate(violation.resolvedDate)}</p>
                  </div>
                  {violation.resolvedBy && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Resolved By</label>
                      <p className="text-sm mt-1">{violation.resolvedBy}</p>
                    </div>
                  )}
                </div>
                
                {violation.resolutionNotes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Resolution Notes</label>
                    <p className="text-sm mt-1 p-3 bg-green-50 rounded-md">{violation.resolutionNotes}</p>
                  </div>
                )}
                
                {violation.paymentMethod && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Method</label>
                      <p className="text-sm mt-1 capitalize">{violation.paymentMethod.replace('_', ' ')}</p>
                    </div>
                    {violation.receiptNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Receipt Number</label>
                        <p className="text-sm mt-1">{violation.receiptNumber}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {canEdit && (
              <>
                {!violation.resolved && (
                  <>
                    <Button variant="outline" onClick={() => onEdit(violation)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      onClick={() => onResolve(violation)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  </>
                )}
                
                <Button 
                  variant="destructive" 
                  onClick={() => onDelete(violation)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViolationDetailsModal;
