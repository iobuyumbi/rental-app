import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Package, 
  CheckCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

const InventoryAnalytics = ({ products, categories }) => {
  const totalStock = products.reduce((sum, p) => sum + (p.quantityInStock || 0), 0);
  const totalRented = products.reduce((sum, p) => sum + (p.quantityRented || 0), 0);
  const needsAttention = products.filter(p => p.condition === 'Needs Repair' || p.quantityInStock === 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{products.length}</div>
          <p className="text-xs text-muted-foreground">
            Across {categories.length} categories
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStock}</div>
          <p className="text-xs text-muted-foreground">
            Items in inventory
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items Rented</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRented}</div>
          <p className="text-xs text-muted-foreground">
            Currently out on rental
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{needsAttention}</div>
          <p className="text-xs text-muted-foreground">
            Items needing repair or restocking
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAnalytics;
