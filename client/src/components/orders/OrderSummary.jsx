import React from 'react';

const OrderSummary = ({ totals, discount }) => {
  const discountAmount = (totals.subtotal * (discount || 0)) / 100;
  const finalTotal = totals.subtotal - discountAmount;

  return (
    <div className="border-t p-4 space-y-2">
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span>KES {totals.subtotal.toLocaleString()}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>Discount ({discount}%):</span>
          <span>-KES {discountAmount.toLocaleString()}</span>
        </div>
      )}
      <div className="flex justify-between font-medium border-t pt-2">
        <span>Total:</span>
        <span>KES {finalTotal.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default OrderSummary;
