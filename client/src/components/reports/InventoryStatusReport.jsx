import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const InventoryStatusReport = ({ inventoryStatus }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Status Report</CardTitle>
        <CardDescription>
          Current inventory levels and status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {inventoryStatus.totalProducts || 0}
                </p>
                <p className="text-sm text-gray-600">Total Products</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {inventoryStatus.availableProducts || 0}
                </p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {inventoryStatus.rentedProducts || 0}
                </p>
                <p className="text-sm text-gray-600">Currently Rented</p>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Export button removed: server does not implement exports */}
      </CardContent>
    </Card>
  );
};

export default InventoryStatusReport;
