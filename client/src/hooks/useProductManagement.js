import { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for managing product selection and order items.
 * Extracts all product-related logic from OrderForm and OrdersPage components.
 * * @param {Array<Object>} products - List of available products.
 * @param {Object} [currentUser] - Optional user object for tracking who modified prices.
 */
const useProductManagement = (products = [], currentUser) => {
  // Product selection state
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState([]);

  // --- Utility Memos ---

  // Filter products based on search (Memoized for efficiency)
  const filteredProducts = useMemo(() => {
    if (!productSearch) {
      return products || [];
    }

    const searchTerm = productSearch.toLowerCase();
    return (products || []).filter(product =>
      product.name?.toLowerCase().includes(searchTerm) ||
      product.type?.toLowerCase().includes(searchTerm) ||
      product.category?.toLowerCase().includes(searchTerm)
    );
  }, [productSearch, products]);

  // --- Order Item Actions (Memoized via useCallback) ---

  // Add item to order
  const addItemToOrder = useCallback(() => {
    // Ensure product and quantity are valid
    const safeQuantity = parseInt(quantity);

    if (!selectedProduct || safeQuantity < 1 || isNaN(safeQuantity)) {
      toast.error('Please select a product and specify a valid quantity (1 or more)');
      return;
    }

    setOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.productId === selectedProduct._id
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + safeQuantity
        };
        toast.success(`Updated ${selectedProduct.name} quantity to ${updatedItems[existingItemIndex].quantity}`);
        return updatedItems;
      } else {
        // Add new item
        const newItem = {
          productId: selectedProduct._id,
          productName: selectedProduct.name,
          quantity: safeQuantity,
          unitPrice: selectedProduct.rentalPrice || 0,
          daysUsed: 1, // Default, can be customized per item
        };
        toast.success(`Added ${selectedProduct.name} to order`);
        return [...prevItems, newItem];
      }
    });

    // Reset selection state
    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
  }, [selectedProduct, quantity]);

  // Update item quantity by index
  const updateItemQuantity = useCallback((index, newQuantity) => {
    const safeQuantity = parseInt(newQuantity);
    if (safeQuantity < 1 || isNaN(safeQuantity)) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setOrderItems(prevItems => 
      prevItems.map((item, i) => 
        i === index ? { ...item, quantity: safeQuantity } : item
      )
    );
  }, []);

  // Update item unit price by index
  const updateItemUnitPrice = useCallback((index, newPrice) => {
    const safePrice = parseFloat(newPrice);
    if (safePrice < 0 || isNaN(safePrice)) {
      toast.error('Price cannot be negative');
      return;
    }

    const modifierName = currentUser?.name || 'Unknown User';
    const modifiedAt = new Date().toISOString();

    setOrderItems(prevItems => {
      const updatedItems = prevItems.map((item, i) => 
        i === index 
          ? { 
              ...item, 
              unitPrice: safePrice, 
              priceModifiedBy: modifierName,
              priceModifiedAt: modifiedAt
            } 
          : item
      );
      toast.success('Price updated successfully');
      return updatedItems;
    });
  }, [currentUser]);

  // Update item days used by index
  const updateItemDaysUsed = useCallback((index, newDays) => {
    const safeDays = parseInt(newDays);
    if (safeDays < 1 || isNaN(safeDays)) {
      toast.error('Days used must be at least 1');
      return;
    }

    setOrderItems(prevItems => 
      prevItems.map((item, i) => 
        i === index ? { ...item, daysUsed: safeDays } : item
      )
    );
  }, []);

  // Remove item from order
  const removeItem = useCallback((index) => {
    const item = orderItems[index];
    setOrderItems(prevItems => prevItems.filter((_, i) => i !== index));
    toast.success(`Removed ${item?.productName || 'Item'} from order`);
  }, [orderItems]); // dependency needed for toast message

  // Clear all items and reset product selection
  const clearAllItems = useCallback(() => {
    setOrderItems([]);
    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
  }, []);

  // Set order items (for editing existing orders)
  const setOrderItemsFromOrder = useCallback((items) => {
    const mappedItems = (items || []).map((item) => ({
      productId: item.product?._id || item.product,
      productName: item.product?.name || item.productName || 'Unknown Product',
      quantity: item.quantityRented || item.quantity || 1,
      unitPrice: item.unitPriceAtTimeOfRental || item.unitPrice || 0,
      daysUsed: item.daysUsed || 1,
      priceModifiedBy: item.priceModifiedBy,
      priceModifiedAt: item.priceModifiedAt,
    }));
    setOrderItems(mappedItems);
  }, []);

  // Get order items in API format
  const getOrderItemsForAPI = useCallback(() => {
    return orderItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      daysUsed: item.daysUsed || 1,
      priceModifiedBy: item.priceModifiedBy,
      priceModifiedAt: item.priceModifiedAt
    }));
  }, [orderItems]);

  // Calculate totals for current items
  const calculateItemTotals = useCallback((chargeableDays = 1) => {
    const subtotal = orderItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const itemDays = item.daysUsed || chargeableDays;
      return sum + quantity * unitPrice * itemDays;
    }, 0);

    return {
      subtotal,
      itemCount: orderItems.length,
      totalQuantity: orderItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
    };
  }, [orderItems]);

  // Validate order items
  const validateOrderItems = useCallback(() => {
    const errors = [];

    if (orderItems.length === 0) {
      errors.push('Please add at least one product to the order');
    }

    orderItems.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Missing product ID`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Item ${index + 1}: Price cannot be negative`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [orderItems]);

  // Utility to find product by ID
  const findProductById = useCallback((productId) => {
    return products.find(product => product._id === productId);
  }, [products]);

  // Utility to check if product is already in order
  const isProductInOrder = useCallback((productId) => {
    return orderItems.some(item => item.productId === productId);
  }, [orderItems]);

  return {
    // Product search state
    productSearch,
    setProductSearch,
    selectedProduct,
    setSelectedProduct,
    quantity,
    setQuantity,
    filteredProducts,

    // Order items state
    orderItems,
    setOrderItems, // Exposing setter for full replacement/reset

    // Product actions
    addItemToOrder,
    updateItemQuantity,
    updateItemUnitPrice,
    updateItemDaysUsed,
    removeItem,
    clearAllItems,

    // Order management
    setOrderItemsFromOrder,
    getOrderItemsForAPI,
    calculateItemTotals,
    validateOrderItems,

    // Utility functions
    findProductById,
    isProductInOrder
  };
};

export default useProductManagement;
