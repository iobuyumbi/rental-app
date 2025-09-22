import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

const ProductSelector = ({
  productSearch,
  setProductSearch,
  quantity,
  setQuantity,
  filteredProducts,
  selectedProduct,
  setSelectedProduct,
  onAddItem
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Add Products</label>
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setShowDropdown(true);
              setSelectedProduct(null);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showDropdown && productSearch && filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
              {filteredProducts.slice(0, 5).map((product) => (
                <div
                  key={product._id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedProduct(product);
                    setProductSearch(product.name);
                    setShowDropdown(false);
                  }}
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    KES {product.rentalPrice} - Stock: {product.quantityInStock}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <input
          type="number"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
        />
        <Button
          type="button"
          onClick={onAddItem}
          disabled={!selectedProduct}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProductSelector;
