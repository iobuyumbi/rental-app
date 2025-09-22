import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  ShoppingCart, 
  Wrench, 
  DollarSign, 
  Coffee,
  Users
} from 'lucide-react';
import DataTable from '../common/DataTable';
import TransactionSummaryTab from './TransactionSummaryTab';

const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'Pending': return 'secondary';
    case 'In Progress': return 'outline';
    case 'Completed': return 'default';
    case 'Cancelled': return 'destructive';
    default: return 'secondary';
  }
};

const TransactionTabs = ({
  purchases,
  repairs,
  laborCosts,
  lunchAllowances,
  summary,
  loading,
  onAddPurchase,
  onAddRepair,
  onEditRepair,
  onAddLunchAllowance,
  onEditLunchAllowance,
  onDeleteLunchAllowance,
  getProductName
}) => {
  // Define purchase table columns
  const purchaseColumns = [
    {
      header: 'Product',
      accessor: 'productId',
      render: (purchase) => getProductName(purchase.productId)
    },
    {
      header: 'Quantity',
      accessor: 'quantity'
    },
    {
      header: 'Unit Cost',
      accessor: 'unitCost',
      type: 'currency'
    },
    {
      header: 'Total Cost',
      accessor: 'totalCost',
      render: (purchase) => `Ksh ${((purchase.quantity || 0) * (purchase.unitCost || 0)).toLocaleString()}`
    },
    {
      header: 'Supplier',
      accessor: 'supplier'
    },
    {
      header: 'Purchase Date',
      accessor: 'purchaseDate',
      type: 'date'
    }
  ];

  // Define repair table columns
  const repairColumns = [
    {
      header: 'Product',
      accessor: 'productId',
    },
    {
      header: 'Description',
      accessor: 'description'
    },
    {
      header: 'Cost',
      accessor: 'cost',
      type: 'currency'
    },
    {
      header: 'Status',
      accessor: 'status',
      type: 'badge',
      getBadgeVariant: getStatusBadgeVariant
    },
    {
      header: 'Technician',
      accessor: 'technician'
    },
    {
      header: 'Repair Date',
      accessor: 'repairDate',
      type: 'date'
    }
  ];

  const laborColumns = [
    {
      header: 'Task',
      accessor: 'taskRate.taskName'
    },
    {
      header: 'Task Type',
      accessor: 'taskRate.taskType'
    },
    {
      header: 'Order',
      accessor: 'order.orderNumber'
    },
    {
      header: 'Quantity',
      accessor: 'quantityCompleted'
    },
    {
      header: 'Rate/Unit',
      accessor: 'taskRate.ratePerUnit',
      type: 'currency'
    },
    {
      header: 'Total Payment',
      accessor: 'totalPayment',
      type: 'currency'
    },
    {
      header: 'Workers',
      accessor: 'workersPresent',
      render: (workers) => workers?.map(w => w.name).join(', ') || 'N/A'
    },
    {
      header: 'Completed Date',
      accessor: 'completedDate',
      type: 'date'
    }
  ];

  const lunchAllowanceColumns = [
    {
      header: 'Worker',
      accessor: 'workerId.name'
    },
    {
      header: 'Date',
      accessor: 'date',
      type: 'date'
    },
    {
      header: 'Amount',
      accessor: 'amount',
      type: 'currency'
    },
    {
      header: 'Status',
      accessor: 'status',
      type: 'badge',
      getBadgeVariant: (status) => status === 'Provided' ? 'default' : 'secondary'
    },
    {
      header: 'Hours Worked',
      accessor: 'attendanceId.hoursWorked',
      render: (hours) => `${hours || 0}h`
    },
    {
      header: 'Task Description',
      accessor: 'attendanceId.taskDescription'
    }
  ];

  return (
    <Tabs defaultValue="purchases" className="space-y-4">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="purchases" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Purchases ({purchases.length})
        </TabsTrigger>
        <TabsTrigger value="repairs" className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Repairs ({repairs.length})
        </TabsTrigger>
        <TabsTrigger value="labor" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Labor ({laborCosts.length})
        </TabsTrigger>
        <TabsTrigger value="lunch" className="flex items-center gap-2">
          <Coffee className="h-4 w-4" />
          Lunch Allowances ({lunchAllowances.length})
        </TabsTrigger>
        <TabsTrigger value="summary" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Summary
        </TabsTrigger>
      </TabsList>

      <TabsContent value="purchases" className="space-y-4">
        <DataTable
          title="Purchase Records"
          description="Track inventory purchases and costs"
          columns={purchaseColumns}
          data={purchases}
          onAdd={onAddPurchase}
          addLabel="Record Purchase"
          searchable={true}
          searchPlaceholder="Search purchases by product, supplier..."
          loading={loading.purchases}
          emptyMessage="No purchases recorded. Start by recording your first purchase."
          emptyIcon={ShoppingCart}
        />
      </TabsContent>

      <TabsContent value="repairs" className="space-y-4">
        <DataTable
          title="Repair Records"
          description="Track equipment repairs and maintenance"
          columns={repairColumns}
          data={repairs}
          onAdd={onAddRepair}
          addLabel="Record Repair"
          onEdit={onEditRepair}
          searchable={true}
          searchPlaceholder="Search repairs by product, technician, description..."
          loading={loading.repairs}
          emptyMessage="No repairs recorded. Start by recording your first repair."
          emptyIcon={Wrench}
        />
      </TabsContent>

      <TabsContent value="labor" className="space-y-4">
        <DataTable
          title="Labor Cost Records"
          description="Track worker task completions and labor costs"
          columns={laborColumns}
          data={laborCosts}
          searchable={true}
          searchPlaceholder="Search by task, worker, order..."
          loading={loading.labor}
          emptyMessage="No labor costs recorded. Complete tasks in Task Management to see costs here."
          emptyIcon={Users}
        />
      </TabsContent>

      <TabsContent value="lunch" className="space-y-4">
        <DataTable
          title="Lunch Allowance Records"
          description="Track daily lunch allowances for workers"
          columns={lunchAllowanceColumns}
          data={lunchAllowances}
          onAdd={onAddLunchAllowance}
          addLabel="Add Lunch Allowance"
          onEdit={onEditLunchAllowance}
          onDelete={onDeleteLunchAllowance}
          searchable={true}
          searchPlaceholder="Search by worker, date, status..."
          loading={loading.lunchAllowance}
          emptyMessage="No lunch allowances recorded. Mark workers as present to generate allowances."
          emptyIcon={Coffee}
        />
      </TabsContent>

      <TabsContent value="summary" className="space-y-4">
        <TransactionSummaryTab 
          summary={summary}
          purchases={purchases}
          repairs={repairs}
          lunchAllowances={lunchAllowances}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TransactionTabs;
