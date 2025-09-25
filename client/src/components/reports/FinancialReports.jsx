import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { DollarSign, Users } from 'lucide-react';

const FinancialReports = ({ discountApprovals, workerRemuneration }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Discount Approvals</CardTitle>
          <CardDescription>
            Recent discount requests and approvals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {discountApprovals.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No discount approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(discountApprovals) && discountApprovals.slice(0, 5).map((discount, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Order #{discount.orderNumber}</p>
                    <p className="text-sm text-gray-600">{discount.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {discount.discountPercentage}% off
                    </p>
                    <p className="text-sm text-gray-600">
                      KES {discount.discountAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {/* Export button removed */}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Worker Remuneration</CardTitle>
          <CardDescription>
            Recent worker payments and calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workerRemuneration.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No remuneration data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(workerRemuneration) && workerRemuneration.slice(0, 5).map((worker, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{worker.name}</p>
                    <p className="text-sm text-gray-600">
                      {worker.totalHours}h worked
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">
                      KES {worker.totalAmount?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {worker.daysWorked} days
                    </p>
                  </div>
                </div>
              ))}
              {/* Export button removed */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReports;
