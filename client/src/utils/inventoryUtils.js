/**
 * Utility functions for advanced inventory and data synchronization tasks.
 * The primary function here is used for fixing data inconsistencies.
 */

import { inventoryAPI, ordersAPI } from '../services/api'; // Assumed API service imports

/**
 * Fix inventory quantities by recalculating the total 'quantityRented' based on active orders.
 * This is primarily a maintenance script that can be run manually (e.g., from the browser console)
 * to ensure data integrity between orders and product stock.
 * * NOTE: This assumes 'inventoryAPI' and 'ordersAPI' are correctly defined elsewhere.
 * * @returns {Promise<Array<Object>>} A list of the updates that were performed.
 */
export const fixInventoryQuantities = async () => {
  try {
    console.log('🔧 Fixing inventory quantities...');
    
    // Get all products and orders concurrently
    const [products, orders] = await Promise.all([
      inventoryAPI.products.get(), // Assuming this fetches all products
      ordersAPI.getOrders()        // Assuming this fetches all orders
    ]);
    
    console.log(`Found ${products.length} products and ${orders.length} orders`);
    
    // Find active orders that impact inventory
    const activeOrders = orders.filter(order => 
      // Only orders that are confirmed or currently out for rental affect the 'quantityRented' count
      order.status === 'in_progress' || order.status === 'confirmed'
    );
    
    console.log(`Found ${activeOrders.length} active orders:`, activeOrders.map(o => ({
      id: o._id?.slice(-6),
      status: o.status,
      client: o.client?.name || 'N/A'
    })));
    
    // Calculate the total quantity that *should* be rented for each product ID
    const productRentals = {};
    
    for (const order of activeOrders) {
      if (order.items) {
        for (const item of order.items) {
          // Handle potential variations in how the product ID is stored
          const productId = item.product?._id || item.product;
          // Use quantityRented first, fall back to general quantity
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
    
    // Update each product's quantityRented if there is a discrepancy
    const updates = [];
    for (const product of products) {
      const shouldBeRented = productRentals[product._id] || 0;
      const currentlyRented = product.quantityRented || 0;
      
      if (shouldBeRented !== currentlyRented) {
        console.log(`Mismatch detected for ${product.name}: ${currentlyRented} → ${shouldBeRented} rented`);
        
        try {
          // Perform the API update
          // IMPORTANT: The existing code passes the whole product object. Ensure your API supports this.
          await inventoryAPI.updateProduct(product._id, {
            ...product,
            quantityRented: shouldBeRented
          });
          
          updates.push({
            name: product.name,
            before: currentlyRented,
            after: shouldBeRented,
            available: (product.quantityInStock || 0) - shouldBeRented
          });
        } catch (error) {
          console.error(`Failed to update ${product.name} (ID: ${product._id}):`, error);
        }
      }
    }
    
    console.log('✅ Inventory fix complete!');
    console.table(updates);
    
    // Trigger a global event to refresh any listening components/data stores
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('inventoryUpdated'));
    }
    
    return updates;
    
  } catch (error) {
    // Utilize the handleError utility if it were imported, but for console tools, a direct throw/log is fine.
    console.error('❌ Error fixing inventory:', error);
    throw error;
  }
};

// Make it available globally for easy console access in development/testing
if (typeof window !== 'undefined') {
  window.fixInventoryQuantities = fixInventoryQuantities;
}
