import React from 'react';
import { Badge } from '../ui/badge';
import { ShoppingCart } from 'lucide-react';
import DataTable from '../common/DataTable';
import OrderStatusBadges, { getStatusBadgeVariant, getPaymentStatusBadgeVariant } from './OrderStatusBadges';

const OrdersTable = ({ 
  orders, 
  loading, 
  onAddOrder, 
  onEditOrder,
  onViewOrder,
  onDeleteOrder 
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Filter out any invalid orders
  const validOrders = Array.isArray(orders) ? orders.filter(order => order && order._id) : [];

  // Define table columns
  const orderColumns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (value, order) => (
        <div className="font-medium">
          #{order?._id ? order._id.slice(-6).toUpperCase() : 'N/A'}
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      render: (value, order) => (
        <div>
          <div className="font-medium">{order.client?.contactPerson || order.client?.name || 'Unknown'}</div>
          {order.orderCompany && (
            <div className="text-sm text-gray-500">Order Company: {order.orderCompany}</div>
          )}
          {!order.orderCompany && order.client?.name && (
            <div className="text-sm text-gray-500">Default Company: {order.client.name}</div>
          )}
          {order.client?.email && (
            <div className="text-sm text-gray-500">{order.client.email}</div>
          )}
        </div>
      )
    },
    {
      key: 'dates',
      label: 'Rental Period',
      render: (value, order) => (
        <div className="text-sm">
          <div>{order.rentalStartDate ? formatDate(order.rentalStartDate) : 'N/A'}</div>
          <div className="text-gray-500">to {order.rentalEndDate ? formatDate(order.rentalEndDate) : 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'items',
      label: 'Items',
      render: (value, order) => (
        <div className="text-sm">
          <div className="font-medium mb-0.5">{order.items?.length || 0} items</div>
          <div className="text-gray-700 space-y-0">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-start leading-tight">
                <span className="font-medium text-blue-600 mr-1.5 min-w-[2rem]">
                  {item.quantityRented || item.quantity || 0}
                </span>
                <span className="flex-1 text-xs">
                  {item.product?.name || item.productName || 'Unknown Item'}
                </span>
              </div>
            )) || (
              <div className="text-gray-400 italic">No items</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value, order) => {
        // Calculate actual amount paid based on payment status and deposits
        const totalAmount = order.totalAmount || 0;
        const deposit = order.deposit || 0;
        let amountPaid = order.amountPaid || 0;
        
        // If payment status is 'paid' but amountPaid is 0, assume full payment
        if (order.paymentStatus === 'paid' && amountPaid === 0) {
          amountPaid = totalAmount;
        }
        // If there's a deposit but no recorded amountPaid, show at least the deposit
        else if (deposit > 0 && amountPaid === 0) {
          amountPaid = deposit;
        }
        // If there's both deposit and amountPaid, ensure amountPaid includes deposit
        else if (deposit > 0 && amountPaid > 0 && amountPaid < deposit) {
          amountPaid = deposit;
        }
        
        return (
          <div className="text-right">
            <div className="font-medium">KES {totalAmount.toLocaleString()}</div>
            <div className="text-sm text-gray-500">
              Paid: KES {amountPaid.toLocaleString()}
              {deposit > 0 && amountPaid !== totalAmount && (
                <div className="text-xs text-blue-600">
                  (Deposit: KES {deposit.toLocaleString()})
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, order) => <OrderStatusBadges order={order} />
    }
  ];

  return (
    <DataTable
      title="Orders"
      description="Manage all rental orders"
      columns={orderColumns}
      data={validOrders}
      onAdd={onAddOrder}
      onEdit={onEditOrder}
      onView={onViewOrder}
      onDelete={onDeleteOrder}
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
