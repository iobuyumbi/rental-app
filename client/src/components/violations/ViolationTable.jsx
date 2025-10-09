import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import DataTable from '../common/DataTable';
import { 
  CheckCircle, 
  Clock, 
  Eye, 
  Edit, 
  Trash2,
  MoreHorizontal,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const ViolationTable = ({
  violations,
  loading,
  selectedViolations,
  onSelectionChange,
  onResolve,
  onEdit,
  onDelete,
  onView,
  onBulkResolve,
  showBulkActions = true
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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

  const getSeverityIcon = (penaltyAmount) => {
    if (penaltyAmount >= 10000) {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    } else if (penaltyAmount >= 5000) {
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = violations.filter(v => !v.resolved).map(v => v._id);
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectViolation = (violationId, checked) => {
    if (checked) {
      onSelectionChange([...selectedViolations, violationId]);
    } else {
      onSelectionChange(selectedViolations.filter(id => id !== violationId));
    }
  };

  const violationColumns = [
    // Selection column
    ...(showBulkActions ? [{
      header: ({ table } = {}) => (
        <Checkbox
          checked={selectedViolations.length === violations.filter(v => !v.resolved).length && violations.filter(v => !v.resolved).length > 0}
          onCheckedChange={handleSelectAll}
          aria-label="Select all"
        />
      ),
      accessor: 'select',
      render: (_, violation) => (
        !violation.resolved && (
          <Checkbox
            checked={selectedViolations.includes(violation._id)}
            onCheckedChange={(checked) => handleSelectViolation(violation._id, checked)}
            aria-label={`Select violation ${violation._id}`}
          />
        )
      )
    }] : []),
    
    // Severity indicator
    {
      header: '',
      accessor: 'severity',
      render: (_, violation) => getSeverityIcon(violation.penaltyAmount)
    },
    
    // Order information
    {
      header: 'Order & Client',
      accessor: 'order',
      render: (order, violation) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">
            #{order?._id?.slice(-8) || violation.orderId?.slice(-8) || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">
            {order?.client?.name || violation.clientName || 'Unknown Client'}
          </div>
          {order?.items && (
            <div className="text-xs text-gray-400">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )
    },
    
    // Violation type
    {
      header: 'Type',
      accessor: 'violationType',
      render: (type) => (
        <Badge className={getViolationTypeColor(type)} variant="outline">
          {type}
        </Badge>
      )
    },
    
    // Description
    {
      header: 'Description',
      accessor: 'description',
      render: (description) => (
        <div className="max-w-xs">
          <p className="text-sm truncate" title={description}>
            {description}
          </p>
        </div>
      )
    },
    
    // Penalty amount
    {
      header: 'Penalty',
      accessor: 'penaltyAmount',
      render: (amount, violation) => (
        <div className="text-right">
          <div className="font-medium text-red-600 flex items-center justify-end gap-1">
            <DollarSign className="h-3 w-3" />
            KES {amount?.toLocaleString() || '0'}
          </div>
          {violation.paidAmount && (
            <div className="text-xs text-green-600">
              Paid: KES {violation.paidAmount.toLocaleString()}
            </div>
          )}
        </div>
      )
    },
    
    // Status
    {
      header: 'Status',
      accessor: 'resolved',
      render: (resolved, violation) => (
        <div className="flex items-center gap-2">
          {resolved ? (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600 text-sm font-medium">Resolved</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-orange-600 text-sm font-medium">Pending</span>
            </div>
          )}
          {violation.resolvedDate && (
            <div className="text-xs text-gray-500 ml-2">
              {new Date(violation.resolvedDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    
    // Date created
    {
      header: 'Created',
      accessor: 'createdAt',
      render: (date) => (
        <div className="text-sm">
          {new Date(date).toLocaleDateString()}
          <div className="text-xs text-gray-500">
            {new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )
    },
    
    // Actions
    {
      header: 'Actions',
      accessor: '_id',
      render: (id, violation) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(violation)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            
            {!violation.resolved && (
              <>
                <DropdownMenuItem onClick={() => onEdit(violation)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => onResolve(violation)}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Resolve
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => onDelete(violation)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const bulkActions = showBulkActions && selectedViolations.length > 0 ? (
    <div className="flex items-center gap-2 p-4 bg-blue-50 border-b">
      <span className="text-sm text-blue-700">
        {selectedViolations.length} violation{selectedViolations.length !== 1 ? 's' : ''} selected
      </span>
      <Button
        size="sm"
        onClick={() => onBulkResolve(selectedViolations)}
        className="bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Resolve Selected
      </Button>
    </div>
  ) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Violations</CardTitle>
        <CardDescription>
          Manage rental violations including overdue returns, damaged items, and missing items
        </CardDescription>
      </CardHeader>
      
      {bulkActions}
      
      <CardContent className={bulkActions ? "pt-0" : ""}>
        <DataTable
          columns={violationColumns}
          data={violations}
          loading={loading}
          searchable={false} // Search is handled by filters
          emptyMessage="No violations found. This is good news!"
          emptyIcon={CheckCircle}
          sortConfig={sortConfig}
          onSort={setSortConfig}
        />
      </CardContent>
    </Card>
  );
};

export default ViolationTable;
