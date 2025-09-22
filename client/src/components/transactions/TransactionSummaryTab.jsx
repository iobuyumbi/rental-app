import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  ShoppingCart, 
  Wrench, 
  DollarSign, 
  Coffee,
  Package,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const TransactionSummaryTab = ({ summary, purchases, repairs, lunchAllowances }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Summary</CardTitle>
          <CardDescription>
            Overview of inventory purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-blue-600">{purchases.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-green-600">
                  KES {summary.purchases?.totalCost?.toLocaleString() || '0'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Average Cost</p>
                <p className="text-2xl font-bold text-purple-600">
                  KES {summary.averagePurchaseCost?.toLocaleString() || '0'}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repair Summary</CardTitle>
          <CardDescription>
            Overview of equipment repairs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Repairs</p>
                <p className="text-2xl font-bold text-orange-600">{repairs.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-red-600">
                  KES {summary.repairs?.totalCost?.toLocaleString() || '0'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Pending Repairs</p>
                <p className="text-2xl font-bold text-gray-600">
                  {Array.isArray(repairs) ? repairs.filter(r => r.status === 'Pending' || r.status === 'In Progress').length : 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Lunch Allowance Summary</CardTitle>
          <CardDescription>
            Overview of worker lunch allowances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Allowances</p>
                <p className="text-2xl font-bold text-amber-600">{lunchAllowances.length}</p>
              </div>
              <Coffee className="h-8 w-8 text-amber-600" />
            </div>
            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-yellow-600">
                  KES {summary.lunchAllowances?.totalCost?.toLocaleString() || '0'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Provided</p>
                <p className="text-2xl font-bold text-green-600">
                  {Array.isArray(lunchAllowances) ? lunchAllowances.filter(l => l.status === 'Provided').length : 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionSummaryTab;
