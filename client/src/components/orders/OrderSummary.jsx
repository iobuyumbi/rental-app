import React from "react";

// A more presentable order summary card with an optional actions area
const OrderSummary = ({
  totals,
  discount,
  actions = null,
  title = "Order Summary",
}) => {
  const discountAmount = (totals.subtotal * (discount || 0)) / 100;
  const finalTotal = totals.subtotal - discountAmount;

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">
            KES {totals.subtotal.toLocaleString()}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({discount}%)</span>
            <span>-KES {discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="h-px bg-gray-200 my-2" />
        <div className="flex justify-between items-center">
          <span className="text-gray-800 font-semibold">Total</span>
          <span className="text-lg font-bold text-gray-900">
            KES {finalTotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
