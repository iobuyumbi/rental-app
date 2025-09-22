import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { X, PlusCircle, MinusCircle, Edit2, Check, X as XIcon } from 'lucide-react';

const OrderItemsTable = ({ 
  orderItems, 
  onUpdateQuantity, 
  onRemoveItem,
  onUpdateUnitPrice,
  currentUser
}) => {
  const [editingPrice, setEditingPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  const handleStartEditPrice = (index, currentPrice) => {
    setEditingPrice(index);
    setTempPrice(currentPrice.toString());
  };

  const handleSavePrice = (index) => {
    const newPrice = parseFloat(tempPrice);
    if (newPrice > 0) {
      onUpdateUnitPrice(index, newPrice, currentUser);
    }
    setEditingPrice(null);
    setTempPrice('');
  };

  const handleCancelEdit = () => {
    setEditingPrice(null);
    setTempPrice('');
  };

  if (orderItems.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderItems.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.productName}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                {editingPrice === index ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      className="w-20 px-2 py-1 border rounded text-sm"
                      min="0"
                      step="0.01"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSavePrice(index)}
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <XIcon className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>KES {item.unitPrice.toLocaleString()}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEditPrice(index, item.unitPrice)}
                    >
                      <Edit2 className="h-3 w-3 text-gray-500" />
                    </Button>
                  </div>
                )}
                {item.priceModifiedBy && (
                  <div className="text-xs text-gray-500 mt-1">
                    Modified by {item.priceModifiedBy}
                  </div>
                )}
              </TableCell>
              <TableCell>KES {(item.quantity * item.unitPrice).toLocaleString()}</TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrderItemsTable;
