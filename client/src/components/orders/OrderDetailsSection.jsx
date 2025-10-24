import React from 'react';
import { XIcon } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import OrderTaskHistory from './OrderTaskHistory';
import OrderWorkflowButtons from './OrderWorkflowButtons';

/**
 * OrderDetailsSection - Handles the comprehensive order view modal
 * Extracted from the monolithic OrdersPage for better separation of concerns
 */
const OrderDetailsSection = ({
  viewingOrder,
  showViewModal,
  setShowViewModal,
  workers,
  handleEditTaskFromHistory,
  handleDeleteTaskFromHistory,
  handleWorkflowTaskCreated,
  taskHistoryRefresh,
}) => {
  if (!showViewModal || !viewingOrder) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => setShowViewModal(false)}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              Order #{viewingOrder._id.slice(-6).toUpperCase()}
            </h2>
            <p className="text-gray-500 mt-1">Order Details and Items</p>
          </div>
          <button
            onClick={() => setShowViewModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Client Info */}
        <ClientInfoSection client={viewingOrder.client} />

        {/* Order Info */}
        <OrderInfoSection order={viewingOrder} />

        {/* Order Items */}
        <OrderItemsSection items={viewingOrder.items} />

        {/* Notes */}
        {viewingOrder.notes && (
          <NotesSection notes={viewingOrder.notes} />
        )}

        {/* Task History */}
        <div className="mb-6 p-4 border rounded-lg">
          <OrderTaskHistory
            order={viewingOrder}
            onEditTask={handleEditTaskFromHistory}
            onDeleteTask={handleDeleteTaskFromHistory}
            refreshTrigger={taskHistoryRefresh}
          />
        </div>

        {/* Workflow Buttons */}
        <div className="mb-6 p-4 border rounded-lg">
          <OrderWorkflowButtons
            order={viewingOrder}
            workers={workers}
            onTaskCreated={handleWorkflowTaskCreated}
            disabled={viewingOrder.status === 'cancelled'}
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowViewModal(false)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * ClientInfoSection - Displays client information
 */
const ClientInfoSection = ({ client }) => (
  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
    <h3 className="font-semibold mb-2">Client Information</h3>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-gray-600">Contact Person:</span>
        <div className="font-medium">{client?.contactPerson || 'N/A'}</div>
      </div>
      <div>
        <span className="text-gray-600">Company:</span>
        <div className="font-medium">{client?.name || 'N/A'}</div>
      </div>
      <div>
        <span className="text-gray-600">Phone:</span>
        <div className="font-medium">{client?.phone || 'N/A'}</div>
      </div>
      <div>
        <span className="text-gray-600">Email:</span>
        <div className="font-medium">{client?.email || 'N/A'}</div>
      </div>
    </div>
  </div>
);

/**
 * OrderInfoSection - Displays order information and financial details
 */
const OrderInfoSection = ({ order }) => (
  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
    <h3 className="font-semibold mb-2">Order Information</h3>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-gray-600">Rental Period:</span>
        <div className="font-medium">
          {formatDate(order.rentalStartDate)} - {formatDate(order.rentalEndDate)}
        </div>
      </div>
      <div>
        <span className="text-gray-600">Status:</span>
        <div>{order.status}</div>
      </div>
      <div>
        <span className="text-gray-600">Total Amount:</span>
        <div className="font-medium">KES {order.totalAmount?.toLocaleString()}</div>
      </div>
      <div>
        <span className="text-gray-600">Amount Paid:</span>
        <AmountPaidDisplay order={order} />
      </div>
    </div>
  </div>
);

/**
 * AmountPaidDisplay - Complex logic for displaying amount paid with deposit info
 */
const AmountPaidDisplay = ({ order }) => {
  const totalAmount = order.totalAmount || 0;
  const deposit = order.deposit || 0;
  let amountPaid = order.amountPaid || 0;

  // Apply business logic for amount paid calculation
  if (order.paymentStatus === 'paid' && amountPaid === 0) {
    amountPaid = totalAmount;
  } else if (deposit > 0 && amountPaid === 0) {
    amountPaid = deposit;
  } else if (deposit > 0 && amountPaid > 0 && amountPaid < deposit) {
    amountPaid = deposit;
  }

  return (
    <div className="font-medium">
      KES {amountPaid.toLocaleString()}
      {deposit > 0 && amountPaid !== totalAmount && (
        <div className="text-xs text-blue-600 mt-1">
          (Includes deposit: KES {deposit.toLocaleString()})
        </div>
      )}
    </div>
  );
};

/**
 * OrderItemsSection - Displays order items in a table
 */
const OrderItemsSection = ({ items }) => (
  <div className="mb-6">
    <h3 className="font-semibold mb-3">
      Order Items ({items?.length || 0})
    </h3>
    <div className="border rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items?.map((item, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {item.product?.name || item.productName || 'Unknown Product'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {item.quantityRented || item.quantity || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                KES {(item.unitPriceAtTimeOfRental || item.unitPrice || 0).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                KES {(
                  (item.quantityRented || item.quantity || 0) *
                  (item.unitPriceAtTimeOfRental || item.unitPrice || 0)
                ).toLocaleString()}
              </td>
            </tr>
          )) || (
            <tr>
              <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                No items found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

/**
 * NotesSection - Displays order notes
 */
const NotesSection = ({ notes }) => (
  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
    <h3 className="font-semibold mb-2">Notes</h3>
    <p className="text-sm text-gray-700">{notes}</p>
  </div>
);

export default OrderDetailsSection;
