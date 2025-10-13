import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { X, Edit2, Check, X as XIcon } from 'lucide-react';

const OrderItemsTable = ({ 
  orderItems, 
  onUpdateQuantity, 
  onRemoveItem,
  onUpdateUnitPrice,
  onUpdateDaysUsed,
  currentUser,
  defaultChargeableDays = 1
}) => {
  const [editingPrice, setEditingPrice] = useState(null);
  const [tempPrice, setTempPrice] = useState('');
  const [editingQuantity, setEditingQuantity] = useState(null);
  const [tempQuantity, setTempQuantity] = useState('');
  const [editingDays, setEditingDays] = useState(null);
  const [tempDays, setTempDays] = useState('');

  const handleStartEditPrice = (index, currentPrice) => {
    setEditingPrice(index);
    setTempPrice((currentPrice || 0).toString());
  };

  const handleSavePrice = (index) => {
    const newPrice = parseFloat(tempPrice);
    if (newPrice > 0) {
      onUpdateUnitPrice(index, newPrice, currentUser);
    }
    setEditingPrice(null);
    setTempPrice('');
  };

  const handleCancelEditPrice = () => {
    setEditingPrice(null);
    setTempPrice('');
  };

  const handleStartEditQuantity = (index, currentQuantity) => {
    setEditingQuantity(index);
    setTempQuantity((currentQuantity || 1).toString());
  };

  const handleSaveQuantity = (index) => {
    const newQuantity = parseInt(tempQuantity);
    if (newQuantity > 0) {
      onUpdateQuantity(index, newQuantity);
    }
    setEditingQuantity(null);
    setTempQuantity('');
  };

  const handleCancelEditQuantity = () => {
    setEditingQuantity(null);
    setTempQuantity('');
  };

  const handleStartEditDays = (index, currentDays) => {
    setEditingDays(index);
    setTempDays((currentDays || defaultChargeableDays).toString());
  };

  const handleSaveDays = (index) => {
    const newDays = parseInt(tempDays);
    if (newDays > 0) {
      onUpdateDaysUsed(index, newDays);
    }
    setEditingDays(null);
    setTempDays('');
  };

  const handleCancelEditDays = () => {
    setEditingDays(null);
    setTempDays('');
  };

  if (orderItems.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Product</TableHead>
            <TableHead className="w-[12%]">Quantity</TableHead>
            <TableHead className="w-[15%]">Unit Price/Day</TableHead>
            <TableHead className="w-[12%]">Days Used</TableHead>
            <TableHead className="w-[18%]">Total</TableHead>
            <TableHead className="w-[8%]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderItems.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.productName || item.product?.name || 'Unknown Product'}</TableCell>
              <TableCell>
                {editingQuantity === index ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={tempQuantity}
                      onChange={(e) => setTempQuantity(e.target.value)}
                      className="w-20 px-2 py-1 border rounded text-sm"
                      min="1"
                      step="1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveQuantity(index)}
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEditQuantity}
                    >
                      <XIcon className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{item.quantity || 0}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEditQuantity(index, item.quantity)}
                    >
                      <Edit2 className="h-3 w-3 text-gray-500" />
                    </Button>
                  </div>
                )}
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
                      onClick={handleCancelEditPrice}
                    >
                      <XIcon className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>KES {item.unitPrice ? item.unitPrice.toLocaleString() : '0'}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEditPrice(index, item.unitPrice || 0)}
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
              
              {/* Days Used Column */}
              <TableCell>
                {editingDays === index ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={tempDays}
                      onChange={(e) => setTempDays(e.target.value)}
                      className="w-16 px-2 py-1 border rounded text-sm"
                      min="1"
                      step="1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveDays(index)}
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEditDays}
                    >
                      <XIcon className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{item.daysUsed || defaultChargeableDays}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEditDays(index, item.daysUsed)}
                    >
                      <Edit2 className="h-3 w-3 text-gray-500" />
                    </Button>
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                <div>
                  <div className="font-medium">
                    KES {((item.quantity || 0) * (item.unitPrice || 0) * (item.daysUsed || defaultChargeableDays)).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.quantity || 0} × KES {(item.unitPrice || 0).toLocaleString()} × {item.daysUsed || defaultChargeableDays} days
                  </div>
                </div>
              </TableCell>
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
