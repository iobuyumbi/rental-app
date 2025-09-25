import React from 'react';
import { Badge } from '../ui/badge';
import { ShoppingCart } from 'lucide-react';
import DataTable from '../common/DataTable';
import OrderStatusBadges, { getStatusBadgeVariant, getPaymentStatusBadgeVariant } from './OrderStatusBadges';

const OrdersTable = ({ 
  orders, 
  loading, 
  onAddOrder, 
  onEditOrder 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Define table columns
  const orderColumns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (order) => (
        <div className="font-medium">
          #{order._id?.slice(-6).toUpperCase()}
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      render: (order) => (
        <div>
          <div className="font-medium">{order.client?.contactPerson || 'Unknown'}</div>
          {order.orderCompany && (
            <div className="text-sm text-gray-500">Order Company: {order.orderCompany}</div>
          )}
          {!order.orderCompany && order.client?.name && (
            <div className="text-sm text-gray-500">Default Company: {order.client.name}</div>
          )}
          <div className="text-sm text-gray-500">{order.client?.email}</div>
        </div>
      )
    },
    {
      key: 'dates',
      label: 'Rental Period',
      render: (order) => (
        <div className="text-sm">
          <div>{formatDate(order.startDate)}</div>
          <div className="text-gray-500">to {formatDate(order.endDate)}</div>
        </div>
      )
    },
    {
      key: 'items',
      label: 'Items',
      render: (order) => (
        <div className="text-sm">
          <div className="font-medium">{order.items?.length || 0} items</div>
          <div className="text-gray-500">
            {order.items?.slice(0, 2).map(item => item.productName).join(', ')}
            {order.items?.length > 2 && '...'}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (order) => (
        <div className="text-right">
          <div className="font-medium">KES {order.totalAmount?.toLocaleString()}</div>
          <div className="text-sm text-gray-500">
            Paid: KES {order.amountPaid?.toLocaleString() || '0'}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (order) => <OrderStatusBadges order={order} />
    }
  ];

  return (
    <DataTable
      title="Orders"
      description="Manage all rental orders"
      columns={orderColumns}
      data={orders}
      onAdd={onAddOrder}
      onEdit={onEditOrder}
      // onDelete not provided: delete is not supported by API
      addLabel="Create Order"
      searchable={true}
      searchPlaceholder="Search orders by client, order number..."
      loading={loading}
      emptyMessage="No orders found. Create your first order to get started."
      emptyIcon={ShoppingCart}
    />
  );
};

export default OrdersTable;
