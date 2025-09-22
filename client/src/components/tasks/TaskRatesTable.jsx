import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import DataTable from '../common/DataTable';

const TaskRatesTable = ({ 
  taskRates, 
  loading, 
  onEditRate, 
  onDeleteRate 
}) => {
  const rateColumns = [
    {
      key: 'taskType',
      label: 'Task Type',
      render: (value) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      )
    },
    { key: 'taskName', label: 'Task Name' },
    {
      key: 'ratePerUnit',
      label: 'Rate',
      render: (value, row) => `KES ${value || 0} ${row?.unit || 'per unit'}`
    },
    { key: 'description', label: 'Description' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditRate(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteRate(row._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      data={taskRates}
      columns={rateColumns}
      loading={loading}
      searchable={true}
      searchPlaceholder="Search task rates..."
    />
  );
};

export default TaskRatesTable;
