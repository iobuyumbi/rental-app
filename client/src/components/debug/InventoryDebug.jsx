import React, { useState, useEffect } from 'react';
import { inventoryAPI, ordersAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RefreshCw, Package, ShoppingCart } from 'lucide-react';

/**
 * InventoryDebug - Debug component to check current inventory status and active orders
 * This helps diagnose why inventory quantities might not be updating
 */
const InventoryDebug = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Fetching debug data...');
      
      const [productsResponse, ordersResponse] = await Promise.all([
        inventoryAPI.products.get(),
        ordersAPI.getOrders()
      ]);
      
      console.log('Products response:', productsResponse);
      console.log('Orders response:', ordersResponse);
      
      setProducts(productsResponse || []);
      setOrders(ordersResponse || []);
    } catch (error) {
      console.error('Error fetching debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeOrders = orders.filter(order => 
    order.status === 'in_progress' || order.status === 'confirmed'
  );

  const getProductUsage = (productId) => {
    let totalRented = 0;
    activeOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const itemProductId = item.product?._id || item.product;
          if (itemProductId === productId) {
            totalRented += item.quantityRented || item.quantity || 0;
          }
        });
      }
    });
    return totalRented;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventory Debug Panel</h2>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Active Orders Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Active Orders ({activeOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeOrders.length === 0 ? (
            <p className="text-gray-500">No active orders found</p>
          ) : (
            <div className="space-y-2">
              {activeOrders.map(order => (
                <div key={order._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      Order #{order._id?.slice(-6).toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Items: {order.items?.length || 0} | 
                    Client: {order.client?.name || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Inventory Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Inventory Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-gray-500">No products found</p>
          ) : (
            <div className="space-y-3">
              {products.map(product => {
                const calculatedRented = getProductUsage(product._id);
                const dbRented = product.quantityRented || 0;
                const inStock = product.quantityInStock || 0;
                const available = inStock - dbRented;
                const calculatedAvailable = inStock - calculatedRented;
                
                const hasDiscrepancy = calculatedRented !== dbRented;
                
                return (
                  <div key={product._id} className={`p-4 rounded-lg border ${
                    hasDiscrepancy ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-gray-600">
                          Category: {product.category?.name || 'No Category'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>In Stock:</strong> {inStock}
                          </div>
                          <div className={hasDiscrepancy ? 'text-red-600' : ''}>
                            <strong>DB Rented:</strong> {dbRented}
                          </div>
                          <div className={hasDiscrepancy ? 'text-orange-600' : ''}>
                            <strong>Calc Rented:</strong> {calculatedRented}
                          </div>
                          <div className="font-medium">
                            <strong>Available:</strong> {available}
                          </div>
                          {hasDiscrepancy && (
                            <div className="text-red-600 font-medium">
                              <strong>Should be:</strong> {calculatedAvailable}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {hasDiscrepancy && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-sm text-red-800">
                        ⚠️ Discrepancy detected! Database shows {dbRented} rented, 
                        but active orders indicate {calculatedRented} should be rented.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw Data (for debugging) */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data (Console)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={() => console.log('Products:', products)}
            >
              Log Products to Console
            </Button>
            <Button 
              variant="outline" 
              onClick={() => console.log('Orders:', orders)}
            >
              Log Orders to Console
            </Button>
            <Button 
              variant="outline" 
              onClick={() => console.log('Active Orders:', activeOrders)}
            >
              Log Active Orders to Console
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryDebug;
