import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { calculateChargeableDays, formatDate, calculateRentalPeriod } from '../../utils/dateUtils';
import { handleError } from '../../utils/errorHandling.jsx';

/**
 * Task Calculator - Calculates task amounts based on order items and task type
 */

// Task rate configuration per category and task type
const TASK_RATES = {
  // Rates per item for different categories
  chairs: {
    arranging_pickup: 0.8,    // KES 0.8 per chair for arranging pickup
    issuing: 1,               // KES 1 per chair for issuing
    loading: 0.3,             // KES 0.3 per chair for loading
    transport: 0.2,           // KES 0.2 per chair for transport
    unloading: 0.3,           // KES 0.3 per chair for unloading at site
    receiving: 0.5,           // KES 0.5 per chair for receiving returns
    loading_returns: 0.3,     // KES 0.3 per chair for loading returns
    transport_returns: 0.2,   // KES 0.2 per chair for transport returns
    unloading_returns: 0.3,   // KES 0.3 per chair for unloading returns
    storing: 0.8              // KES 0.8 per chair for storing back
  },
  tables: {
    arranging_pickup: 4,      // KES 4 per table for arranging pickup
    issuing: 5,               // KES 5 per table for issuing
    loading: 2,               // KES 2 per table for loading
    transport: 1.5,           // KES 1.5 per table for transport
    unloading: 2,             // KES 2 per table for unloading at site
    receiving: 3,             // KES 3 per table for receiving returns
    loading_returns: 2,       // KES 2 per table for loading returns
    transport_returns: 1.5,   // KES 1.5 per table for transport returns
    unloading_returns: 2,     // KES 2 per table for unloading returns
    storing: 4                // KES 4 per table for storing back
  },
  tents: {
    arranging_pickup: 8,      // KES 8 per tent for arranging pickup
    issuing: 10,              // KES 10 per tent for issuing
    loading: 5,               // KES 5 per tent for loading
    transport: 3,             // KES 3 per tent for transport
    unloading: 5,             // KES 5 per tent for unloading at site
    receiving: 8,             // KES 8 per tent for receiving returns
    loading_returns: 5,       // KES 5 per tent for loading returns
    transport_returns: 3,     // KES 3 per tent for transport returns
    unloading_returns: 5,     // KES 5 per tent for unloading returns
    storing: 8                // KES 8 per tent for storing back
  },
  // Default rates for unknown categories
  default: {
    arranging_pickup: 1.5,
    issuing: 2,
    loading: 1,
    transport: 0.5,
    unloading: 1,
    receiving: 1.5,
    loading_returns: 1,
    transport_returns: 0.5,
    unloading_returns: 1,
    storing: 1.5
  }
};

// Fixed rates for certain task types (not item-based)
const FIXED_TASK_RATES = {
  loading: {
    lorry: 200,      // KES 200 for loading a lorry
    pickup: 100,     // KES 100 for loading a pickup
    van: 150         // KES 150 for loading a van
  },
  unloading: {
    lorry: 200,
    pickup: 100,
    van: 150
  },
  transport: {
    local: 500,      // KES 500 for local transport
    outOfTown: 1000  // KES 1000 for out of town transport
  }
};

/**
 * Determines the category of an item based on its name
 */
const getItemCategory = (itemName) => {
  if (!itemName) return 'default';
  
  const name = itemName.toLowerCase();
  
  if (name.includes('chair')) return 'chairs';
  if (name.includes('table')) return 'tables';
  if (name.includes('tent')) return 'tents';
  
  return 'default';
};

/**
 * Calculates task amount based on order items and task type
 * Enhanced version that can work with order dates for better integration
 */
export const calculateTaskAmount = (orderItems = [], taskType, options = {}) => {
  const { vehicleType = null, transportType = null, order = null } = options;
  
  if (!orderItems || orderItems.length === 0) return 0;
  
  let totalAmount = 0;
  
  // For loading/unloading, check if there's a fixed rate based on vehicle type
  if ((taskType === 'loading' || taskType === 'unloading') && vehicleType) {
    const fixedRate = FIXED_TASK_RATES[taskType]?.[vehicleType];
    if (fixedRate) {
      return fixedRate;
    }
  }
  
  // For transport, check if there's a fixed rate based on transport type
  if (taskType === 'transport' && transportType) {
    const fixedRate = FIXED_TASK_RATES[taskType]?.[transportType];
    if (fixedRate) {
      return fixedRate;
    }
  }
  
  // Calculate based on items
  orderItems.forEach(item => {
    const quantity = item.quantityRented || item.quantity || 0;
    const itemName = item.product?.name || item.productName || '';
    const category = getItemCategory(itemName);
    
    const rate = TASK_RATES[category]?.[taskType] || TASK_RATES.default[taskType] || 0;
    totalAmount += quantity * rate;
  });
  
  return Math.round(totalAmount);
};

/**
 * Enhanced task amount calculation with order context
 * Provides additional context like rental period for better task planning
 */
export const calculateTaskAmountWithContext = (order, taskType, options = {}) => {
  if (!order) return { amount: 0, context: null };
  
  const amount = calculateTaskAmount(order.items || [], taskType, options);
  
  // Calculate additional context
  const context = {
    orderId: order._id,
    clientName: order.client?.contactPerson || order.client?.name,
    itemCount: (order.items || []).length,
    totalQuantity: (order.items || []).reduce((sum, item) => 
      sum + (item.quantityRented || item.quantity || 0), 0
    ),
    rentalPeriod: null,
    chargeableDays: 1
  };
  
  // Add rental period context if dates are available
  if (order.rentalStartDate && order.rentalEndDate) {
    context.chargeableDays = calculateChargeableDays(
      order.rentalStartDate,
      order.rentalEndDate,
      1
    );
    context.rentalPeriod = {
      start: order.rentalStartDate,
      end: order.rentalEndDate,
      days: context.chargeableDays
    };
  }
  
  return { amount, context };
};

/**
 * Gets a breakdown of task calculation for display
 */
export const getTaskCalculationBreakdown = (orderItems = [], taskType, vehicleType = null, transportType = null) => {
  if (!orderItems || orderItems.length === 0) return { items: [], total: 0, fixedRate: null };
  
  // Check for fixed rates first
  if ((taskType === 'loading' || taskType === 'unloading') && vehicleType) {
    const fixedRate = FIXED_TASK_RATES[taskType]?.[vehicleType];
    if (fixedRate) {
      return {
        items: [],
        total: fixedRate,
        fixedRate: {
          type: vehicleType,
          amount: fixedRate,
          description: `${taskType} ${vehicleType}`
        }
      };
    }
  }
  
  if (taskType === 'transport' && transportType) {
    const fixedRate = FIXED_TASK_RATES[taskType]?.[transportType];
    if (fixedRate) {
      return {
        items: [],
        total: fixedRate,
        fixedRate: {
          type: transportType,
          amount: fixedRate,
          description: `${transportType} transport`
        }
      };
    }
  }
  
  // Calculate item-based breakdown
  const items = [];
  let total = 0;
  
  orderItems.forEach(item => {
    const quantity = item.quantityRented || item.quantity || 0;
    const itemName = item.product?.name || item.productName || '';
    const category = getItemCategory(itemName);
    
    const rate = TASK_RATES[category]?.[taskType] || TASK_RATES.default[taskType] || 0;
    const amount = quantity * rate;
    
    if (amount > 0) {
      items.push({
        name: itemName,
        quantity,
        rate,
        amount,
        category
      });
      total += amount;
    }
  });
  
  return {
    items,
    total: Math.round(total),
    fixedRate: null
  };
};

/**
 * Task Calculator Display Component
 * Enhanced version with order context support
 */
const TaskCalculator = ({ 
  orderItems, 
  taskType, 
  vehicleType = null, 
  transportType = null,
  order = null,
  onAmountCalculated,
  showContext = false 
}) => {
  // Use enhanced calculation if order is provided
  const calculationResult = React.useMemo(() => {
    if (order) {
      return calculateTaskAmountWithContext(order, taskType, { vehicleType, transportType });
    }
    
    // Fallback to basic calculation
    const amount = calculateTaskAmount(orderItems, taskType, { vehicleType, transportType });
    return { amount, context: null };
  }, [order, orderItems, taskType, vehicleType, transportType]);
  
  const breakdown = getTaskCalculationBreakdown(orderItems, taskType, vehicleType, transportType);
  
  React.useEffect(() => {
    if (onAmountCalculated) {
      onAmountCalculated(calculationResult.amount);
    }
  }, [calculationResult.amount, onAmountCalculated]);
  
  if (breakdown.total === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No calculation available for this task type
      </div>
    );
  }
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
      <div className="font-medium text-blue-800 mb-2">
        Task Amount Calculation
        {calculationResult.context && showContext && (
          <span className="text-xs font-normal text-blue-600 ml-2">
            (Order #{calculationResult.context.orderId?.slice(-6).toUpperCase()})
          </span>
        )}
      </div>
      
      {/* Show order context if available */}
      {calculationResult.context && showContext && (
        <div className="bg-blue-100 rounded p-2 mb-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Client:</span> {calculationResult.context.clientName}
            </div>
            <div>
              <span className="font-medium">Items:</span> {calculationResult.context.itemCount} ({calculationResult.context.totalQuantity} total qty)
            </div>
            {calculationResult.context.rentalPeriod && (
              <>
                <div>
                  <span className="font-medium">Rental Days:</span> {calculationResult.context.chargeableDays}
                </div>
                <div>
                  <span className="font-medium">Period:</span> {new Date(calculationResult.context.rentalPeriod.start).toLocaleDateString()} - {new Date(calculationResult.context.rentalPeriod.end).toLocaleDateString()}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {breakdown.fixedRate ? (
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="capitalize">{breakdown.fixedRate.description}:</span>
            <span className="font-medium">KES {breakdown.fixedRate.amount.toLocaleString()}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {breakdown.items.map((item, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span>
                {item.quantity} × {item.name} @ KES {item.rate}
              </span>
              <span className="font-medium">KES {item.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="border-t border-blue-300 mt-2 pt-2 flex justify-between font-medium text-blue-900">
        <span>Total Task Amount:</span>
        <span>KES {calculationResult.amount.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default TaskCalculator;
