import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Package, 
  DollarSign, 
  Tag,
  BarChart3,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const MobileInventoryCard = ({ product, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getAvailabilityStatus = () => {
    const available = (product.quantityInStock || 0) - (product.quantityRented || 0);
    const total = product.quantityInStock || 0;
    
    if (available === 0) return { status: 'out-of-stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (available <= total * 0.2) return { status: 'low-stock', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    return { status: 'in-stock', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'needs repair': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationRate = () => {
    const total = product.quantityInStock || 0;
    const rented = product.quantityRented || 0;
    return total > 0 ? Math.round((rented / total) * 100) : 0;
  };

  const availability = getAvailabilityStatus();
  const available = (product.quantityInStock || 0) - (product.quantityRented || 0);
  const utilizationRate = getUtilizationRate();

  return (
    <Card className="w-full mb-4 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg truncate">
                {product.name}
              </h3>
              <Badge className={availability.color}>
                <availability.icon className="h-3 w-3 mr-1" />
                {availability.status.replace('-', ' ')}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Tag className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{product.category?.name || 'Uncategorized'}</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4 text-gray-500" />
                <span>{available}/{product.quantityInStock || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="font-medium">KES {product.rentalPrice?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 ml-2">
            <div className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{utilizationRate}%</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Product Image */}
          {product.imageUrl && (
            <div className="mb-4">
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-32 object-cover rounded-lg bg-gray-100"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Product Details */}
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Condition:</span>
                <div className="mt-1">
                  <Badge className={getConditionColor(product.condition)}>
                    {product.condition || 'Unknown'}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Purchase Price:</span>
                <div className="mt-1 font-medium">
                  KES {product.purchasePrice?.toLocaleString() || 'N/A'}
                </div>
              </div>
            </div>

            {/* Serial Number / Item ID */}
            {product.serialNumber && (
              <div className="text-sm">
                <span className="text-gray-600">Item ID:</span>
                <div className="mt-1 font-mono text-xs bg-gray-50 p-2 rounded">
                  {product.serialNumber}
                </div>
              </div>
            )}

            {/* Inventory Status */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Inventory Status</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {product.quantityInStock || 0}
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">
                    {product.quantityRented || 0}
                  </div>
                  <div className="text-xs text-gray-500">Rented</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {available}
                  </div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
              </div>
              
              {/* Utilization Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Utilization</span>
                  <span>{utilizationRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      utilizationRate > 80 ? 'bg-red-500' : 
                      utilizationRate > 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-2 mb-4">
              <div className="text-sm text-gray-600">Description:</div>
              <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded text-xs leading-relaxed">
                {product.description}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit?.(product)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete?.(product)}
              className="flex-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default MobileInventoryCard;
