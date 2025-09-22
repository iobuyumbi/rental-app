import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle } from 'lucide-react';
import DataTable from '../common/DataTable';

const TaskCompletionsTable = ({ 
  taskCompletions, 
  loading, 
  onVerifyTask 
}) => {
  const completionColumns = [
    {
      key: 'taskRate',
      label: 'Task',
      render: (value) => value?.taskName || 'N/A'
    },
    {
      key: 'orderId',
      label: 'Order',
      render: (value) => value?.orderNumber || 'N/A'
    },
    {
      key: 'quantityCompleted',
      label: 'Quantity'
    },
    {
      key: 'workersPresent',
      label: 'Workers',
      render: (value) => value?.length || 0
    },
    {
      key: 'totalPayment',
      label: 'Total Payment',
      render: (value) => `KES ${value?.toFixed(2) || '0.00'}`
    },
    {
      key: 'paymentPerWorker',
      label: 'Per Worker',
      render: (value) => `KES ${value?.toFixed(2) || '0.00'}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Badge variant={value === 'verified' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'taskDate',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status !== 'verified' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVerifyTask(row._id)}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <DataTable
      data={taskCompletions}
      columns={completionColumns}
      loading={loading}
      searchable={true}
      searchPlaceholder="Search task completions..."
    />
  );
};

export default TaskCompletionsTable;
