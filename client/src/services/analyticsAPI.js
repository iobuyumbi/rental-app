import api from './api';

const handleResponse = (response) => {
  if (response.data?.success && response.data?.data) {
    return response.data.data;
  }
  return response.data;
};

const handleError = (error) => {
  console.error('Analytics API Error:', error);
  let message = 'An error occurred';
  
  if (error.response) {
    message = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
  } else if (error.request) {
    message = 'No response from server. Please check your connection.';
  } else {
    message = error.message || 'Network error occurred';
  }
  
  throw new Error(message);
};

export const analyticsAPI = {
  // KPI Dashboard metrics
  getKPIMetrics: async (params = {}) => {
    try {
      const response = await api.get('/analytics/kpi', { params });
      return handleResponse(response);
    } catch (error) {
      // Fallback: calculate KPIs from existing data
      console.warn('KPI endpoint not available, calculating from existing data');
      return await calculateKPIsFallback(params);
    }
  },

  // Utilization metrics
  getUtilizationMetrics: async (params = {}) => {
    try {
      const response = await api.get('/analytics/utilization', { params });
      return handleResponse(response);
    } catch (error) {
      return await calculateUtilizationFallback(params);
    }
  },

  // Revenue analytics
  getRevenueAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/analytics/revenue', { params });
      return handleResponse(response);
    } catch (error) {
      return await calculateRevenueFallback(params);
    }
  },

  // Inventory performance
  getInventoryPerformance: async (params = {}) => {
    try {
      const response = await api.get('/analytics/inventory-performance', { params });
      return handleResponse(response);
    } catch (error) {
      return await calculateInventoryPerformanceFallback(params);
    }
  }
};

// Fallback calculations using existing APIs
const calculateKPIsFallback = async (params = {}) => {
  try {
    const [orders, products] = await Promise.all([
      api.get('/orders', { params }).then(handleResponse),
      api.get('/inventory/products').then(handleResponse)
    ]);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter recent orders
    const recentOrders = orders.filter(order => 
      new Date(order.createdAt) >= thirtyDaysAgo
    );

    // Calculate metrics
    const totalRevenue = recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const completedOrders = recentOrders.filter(order => order.status === 'completed');
    const activeRentals = recentOrders.filter(order => order.status === 'in_progress');
    
    // Calculate utilization rate
    const totalProducts = products.length;
    const rentedProducts = products.reduce((sum, product) => sum + (product.quantityRented || 0), 0);
    const utilizationRate = totalProducts > 0 ? (rentedProducts / totalProducts) * 100 : 0;

    // Calculate average rental duration
    const avgDuration = completedOrders.length > 0 
      ? completedOrders.reduce((sum, order) => {
          const start = new Date(order.rentalStartDate);
          const end = new Date(order.rentalEndDate);
          return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        }, 0) / completedOrders.length
      : 0;

    // Revenue per rental
    const revenuePerRental = completedOrders.length > 0 
      ? totalRevenue / completedOrders.length 
      : 0;

    return {
      totalRevenue,
      totalOrders: recentOrders.length,
      completedOrders: completedOrders.length,
      activeRentals: activeRentals.length,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      averageRentalDuration: Math.round(avgDuration * 100) / 100,
      revenuePerRental: Math.round(revenuePerRental * 100) / 100,
      totalProducts,
      rentedProducts,
      availableProducts: totalProducts - rentedProducts
    };
  } catch (error) {
    console.error('Error calculating KPIs:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      completedOrders: 0,
      activeRentals: 0,
      utilizationRate: 0,
      averageRentalDuration: 0,
      revenuePerRental: 0,
      totalProducts: 0,
      rentedProducts: 0,
      availableProducts: 0
    };
  }
};

const calculateUtilizationFallback = async (params = {}) => {
  try {
    const products = await api.get('/inventory/products').then(handleResponse);
    
    const utilizationData = products.map(product => ({
      productId: product._id,
      productName: product.name,
      category: product.category?.name || 'Uncategorized',
      totalQuantity: product.quantityInStock || 0,
      rentedQuantity: product.quantityRented || 0,
      availableQuantity: (product.quantityInStock || 0) - (product.quantityRented || 0),
      utilizationRate: product.quantityInStock > 0 
        ? ((product.quantityRented || 0) / product.quantityInStock) * 100 
        : 0
    }));

    return {
      products: utilizationData,
      summary: {
        totalItems: products.length,
        highUtilization: utilizationData.filter(p => p.utilizationRate > 80).length,
        mediumUtilization: utilizationData.filter(p => p.utilizationRate > 50 && p.utilizationRate <= 80).length,
        lowUtilization: utilizationData.filter(p => p.utilizationRate <= 50).length
      }
    };
  } catch (error) {
    console.error('Error calculating utilization:', error);
    return { products: [], summary: { totalItems: 0, highUtilization: 0, mediumUtilization: 0, lowUtilization: 0 } };
  }
};

const calculateRevenueFallback = async (params = {}) => {
  try {
    const orders = await api.get('/orders', { params }).then(handleResponse);
    
    const now = new Date();
    const monthlyData = [];
    
    // Generate last 12 months data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= date && orderDate < nextMonth;
      });
      
      const revenue = monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue,
        orders: monthOrders.length
      });
    }

    return {
      monthlyRevenue: monthlyData,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      averageOrderValue: orders.length > 0 
        ? orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length 
        : 0
    };
  } catch (error) {
    console.error('Error calculating revenue:', error);
    return { monthlyRevenue: [], totalRevenue: 0, averageOrderValue: 0 };
  }
};

const calculateInventoryPerformanceFallback = async (params = {}) => {
  try {
    const [products, orders] = await Promise.all([
      api.get('/inventory/products').then(handleResponse),
      api.get('/orders').then(handleResponse)
    ]);

    const performance = products.map(product => {
      const productOrders = orders.filter(order => 
        order.items && order.items.some(item => 
          (item.product?._id || item.product) === product._id
        )
      );

      const totalRented = productOrders.reduce((sum, order) => {
        const item = order.items.find(item => 
          (item.product?._id || item.product) === product._id
        );
        return sum + (item?.quantity || 0);
      }, 0);

      const revenue = productOrders.reduce((sum, order) => {
        const item = order.items.find(item => 
          (item.product?._id || item.product) === product._id
        );
        return sum + (item?.totalPrice || 0);
      }, 0);

      return {
        productId: product._id,
        productName: product.name,
        category: product.category?.name || 'Uncategorized',
        totalQuantity: product.quantityInStock || 0,
        timesRented: totalRented,
        revenue,
        utilizationRate: product.quantityInStock > 0 
          ? ((product.quantityRented || 0) / product.quantityInStock) * 100 
          : 0
      };
    });

    // Sort by revenue descending
    performance.sort((a, b) => b.revenue - a.revenue);

    return {
      products: performance,
      topPerformers: performance.slice(0, 10),
      lowPerformers: performance.filter(p => p.timesRented === 0).slice(0, 10)
    };
  } catch (error) {
    console.error('Error calculating inventory performance:', error);
    return { products: [], topPerformers: [], lowPerformers: [] };
  }
};

export default analyticsAPI;
