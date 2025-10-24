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
  onDeleteOrder,
  onStatusChange,
  onWorkerTask
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
        <div className="font-medium text-sm text-indigo-700">
          #{order?._id ? order._id.slice(-6).toUpperCase() : 'N/A'}
        </div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      render: (value, order) => (
        <div>
          <div className="font-semibold text-gray-800">{order.client?.contactPerson || order.client?.name || 'Unknown'}</div>
          {order.orderCompany && (
            <div className="text-xs text-gray-600 italic">Company: {order.orderCompany}</div>
          )}
          {order.client?.email && (
            <div className="text-xs text-gray-500">{order.client.email}</div>
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
      label: 'Items Overview',
      render: (value, order) => (
        <div className="text-sm max-h-24 overflow-y-auto">
          <div className="font-medium mb-0.5 text-indigo-600">{order.items?.length || 0} unique items</div>
          <div className="text-gray-700 space-y-0.5">
            {order.items?.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-start leading-tight">
                <span className="font-bold text-blue-600 mr-1.5 min-w-[1.5rem]">
                  {item.quantityRented || item.quantity || 0}
                </span>
                <span className="flex-1 text-xs text-gray-600">
                  {item.product?.name || item.productName || 'Unknown Item'}
                </span>
              </div>
            ))}
            {order.items && order.items.length > 3 && (
              <div className="text-xs text-gray-400 italic">... and {order.items.length - 3} more</div>
            )}
            {!order.items?.length && (
              <div className="text-gray-400 italic text-xs">No items recorded</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Amount Due',
      render: (value, order) => {
        const fullAmount = order.totalAmount || 0;
        let amountPaid = order.amountPaid || 0;
        const deposit = order.deposit || 0;
        
        // If payment status is 'paid' but amountPaid is 0, assume full payment
        if (order.paymentStatus === 'paid' && amountPaid === 0) {
          amountPaid = fullAmount;
        }
        
        const balance = fullAmount - amountPaid;
        
        const formatCurrency = (amount) => (amount || 0).toLocaleString('en-KE', { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 0 
        });

        return (
          <div className="text-right">
            <div className="font-extrabold text-lg text-gray-800">
              KES {formatCurrency(fullAmount)}
            </div>
            <div className="text-sm text-gray-600">
              Paid: KES {formatCurrency(amountPaid)}
            </div>
            {balance > 0 && (
              <div className="text-sm text-red-600 font-bold">
                Balance: KES {formatCurrency(balance)}
              </div>
            )}
            {deposit > 0 && amountPaid < fullAmount && (
              <div className="text-xs text-blue-600 italic mt-0.5">
                (Deposit: KES {formatCurrency(deposit)})
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, order) => (
        <div className="flex flex-col gap-1">
          <Badge 
            variant={getStatusBadgeVariant(order.status)} 
            className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onStatusChange && onStatusChange(order)}
          >
            {order.status || 'pending'}
          </Badge>
          <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)} className="text-xs">
            {order.paymentStatus || 'unpaid'}
          </Badge>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, order) => (
        <div className="flex gap-1">
          {onWorkerTask && (
            <button
              onClick={() => onWorkerTask(order)}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title="Create Worker Task"
            >
              Worker Task
            </button>
          )}
        </div>
      )
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
