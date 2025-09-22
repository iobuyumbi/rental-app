import React from 'react';
import { Card, CardContent } from '../ui/card';
import { 
  ShoppingCart, 
  Wrench, 
  DollarSign, 
  Coffee,
  Users
} from 'lucide-react';

const TransactionSummaryCards = ({ summary, purchases, repairs, lunchAllowances }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold">{purchases.length}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Repairs</p>
              <p className="text-2xl font-bold">{repairs.length}</p>
            </div>
            <Wrench className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Purchase Cost</p>
              <p className="text-2xl font-bold text-green-600">
                KES {summary.purchases?.totalCost?.toLocaleString() || '0'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Repair Cost</p>
              <p className="text-2xl font-bold text-red-600">
                KES {summary.repairs?.totalCost?.toLocaleString() || '0'}
              </p>
            </div>
            <Wrench className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Labor Cost</p>
              <p className="text-2xl font-bold text-purple-600">
                KES {summary.labor?.totalCost?.toLocaleString() || '0'}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lunch Allowances</p>
              <p className="text-2xl font-bold text-amber-600">
                KES {summary.lunchAllowances?.totalCost?.toLocaleString() || '0'}
              </p>
            </div>
            <Coffee className="h-8 w-8 text-amber-600" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                KES {summary.summary?.totalExpenses?.toLocaleString() || '0'}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-gray-900" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionSummaryCards;
