import { inventoryAPI, ordersAPI } from '../services/api';

/**
 * Fix inventory quantities by recalculating based on active orders
 * This can be run from the browser console
 */
export const fixInventoryQuantities = async () => {
  try {
    console.log('🔧 Fixing inventory quantities...');
    
    // Get all products and orders
    const [products, orders] = await Promise.all([
      inventoryAPI.products.get(),
      ordersAPI.getOrders()
    ]);
    
    console.log(`Found ${products.length} products and ${orders.length} orders`);
    
    // Find active orders
    const activeOrders = orders.filter(order => 
      order.status === 'in_progress' || order.status === 'confirmed'
    );
    
    console.log(`Found ${activeOrders.length} active orders:`, activeOrders.map(o => ({
      id: o._id?.slice(-6),
      status: o.status,
      client: o.client?.name
    })));
    
    // Calculate how much should be rented for each product
    const productRentals = {};
    
    for (const order of activeOrders) {
      if (order.items) {
        for (const item of order.items) {
          const productId = item.product?._id || item.product;
          const quantity = item.quantityRented || item.quantity || 0;
          
          if (productId && quantity > 0) {
            if (!productRentals[productId]) {
              productRentals[productId] = 0;
            }
            productRentals[productId] += quantity;
          }
        }
      }
    }
    
    console.log('Calculated rentals per product:', productRentals);
    
    // Update each product's quantityRented
    const updates = [];
    for (const product of products) {
      const shouldBeRented = productRentals[product._id] || 0;
      const currentlyRented = product.quantityRented || 0;
      
      if (shouldBeRented !== currentlyRented) {
        console.log(`${product.name}: ${currentlyRented} → ${shouldBeRented} rented`);
        
        try {
          await inventoryAPI.updateProduct(product._id, {
            ...product,
            quantityRented: shouldBeRented
          });
          
          updates.push({
            name: product.name,
            before: currentlyRented,
            after: shouldBeRented,
            available: product.quantityInStock - shouldBeRented
          });
        } catch (error) {
          console.error(`Failed to update ${product.name}:`, error);
        }
      }
    }
    
    console.log('✅ Inventory fix complete!');
    console.log('Updated products:', updates);
    
    // Trigger inventory refresh
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    }
    
    return updates;
    
  } catch (error) {
    console.error('❌ Error fixing inventory:', error);
    throw error;
  }
};

// Make it available globally for console use
if (typeof window !== 'undefined') {
  window.fixInventoryQuantities = fixInventoryQuantities;
}
