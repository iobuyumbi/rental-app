import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { 
  Clock, 
  Calendar, 
  DollarSign, 
  Calculator,
  AlertCircle,
  CheckCircle,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';

const FlexibleRentalPeriods = ({ 
  items = [], 
  onPeriodChange, 
  initialPeriod = null,
  showPricing = true 
}) => {
  const [rentalPeriod, setRentalPeriod] = useState({
    type: 'daily', // hourly, daily, weekly, monthly, custom
    duration: 1,
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00'
  });

  const [pricing, setPricing] = useState({
    baseAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    priceBreakdown: []
  });

  const [extensions, setExtensions] = useState([]);

  useEffect(() => {
    if (initialPeriod) {
      setRentalPeriod(initialPeriod);
    }
  }, [initialPeriod]);

  useEffect(() => {
    calculatePricing();
  }, [rentalPeriod, items]);

  const calculatePricing = () => {
    if (!items.length) return;

    let baseAmount = 0;
    let priceBreakdown = [];

    items.forEach(item => {
      const product = item.product || item;
      const quantity = item.quantity || 1;
      const unitPrice = product.rentalPrice || 0;
      
      let itemTotal = 0;
      let periodMultiplier = 1;
      let discountRate = 0;

      switch (rentalPeriod.type) {
        case 'hourly':
          // Hourly rate (assume daily rate / 8 hours)
          const hourlyRate = unitPrice / 8;
          const hours = calculateHours();
          itemTotal = hourlyRate * hours * quantity;
          periodMultiplier = hours;
          break;

        case 'daily':
          itemTotal = unitPrice * rentalPeriod.duration * quantity;
          periodMultiplier = rentalPeriod.duration;
          // Volume discount for longer periods
          if (rentalPeriod.duration >= 7) discountRate = 0.1; // 10% for weekly+
          if (rentalPeriod.duration >= 30) discountRate = 0.2; // 20% for monthly+
          break;

        case 'weekly':
          // Weekly rate (daily rate * 6 days - 1 day free)
          const weeklyRate = unitPrice * 6;
          itemTotal = weeklyRate * rentalPeriod.duration * quantity;
          periodMultiplier = rentalPeriod.duration;
          discountRate = 0.15; // 15% weekly discount
          break;

        case 'monthly':
          // Monthly rate (daily rate * 25 days - 5 days free)
          const monthlyRate = unitPrice * 25;
          itemTotal = monthlyRate * rentalPeriod.duration * quantity;
          periodMultiplier = rentalPeriod.duration;
          discountRate = 0.25; // 25% monthly discount
          break;

        case 'custom':
          const days = calculateCustomDays();
          itemTotal = unitPrice * days * quantity;
          periodMultiplier = days;
          // Custom period discounts
          if (days >= 7) discountRate = 0.1;
          if (days >= 30) discountRate = 0.2;
          break;
      }

      const discountAmount = itemTotal * discountRate;
      const finalAmount = itemTotal - discountAmount;

      priceBreakdown.push({
        item: product.name,
        quantity,
        unitPrice,
        periodMultiplier,
        baseAmount: itemTotal,
        discountRate,
        discountAmount,
        finalAmount
      });

      baseAmount += itemTotal;
    });

    const totalDiscount = priceBreakdown.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalAmount = baseAmount - totalDiscount;

    setPricing({
      baseAmount,
      discountAmount: totalDiscount,
      totalAmount,
      priceBreakdown
    });

    // Notify parent component
    if (onPeriodChange) {
      onPeriodChange({
        period: rentalPeriod,
        pricing: {
          baseAmount,
          discountAmount: totalDiscount,
          totalAmount,
          priceBreakdown
        }
      });
    }
  };

  const calculateHours = () => {
    if (!rentalPeriod.startTime || !rentalPeriod.endTime) return 8;
    
    const start = new Date(`2000-01-01 ${rentalPeriod.startTime}`);
    const end = new Date(`2000-01-01 ${rentalPeriod.endTime}`);
    
    let hours = (end - start) / (1000 * 60 * 60);
    if (hours <= 0) hours += 24; // Handle overnight rentals
    
    return Math.max(1, hours * rentalPeriod.duration);
  };

  const calculateCustomDays = () => {
    if (!rentalPeriod.startDate || !rentalPeriod.endDate) return 1;
    
    const start = new Date(rentalPeriod.startDate);
    const end = new Date(rentalPeriod.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    return Math.max(1, days);
  };

  const handlePeriodTypeChange = (type) => {
    setRentalPeriod(prev => ({
      ...prev,
      type,
      duration: type === 'custom' ? prev.duration : 1
    }));
  };

  const handleDurationChange = (change) => {
    setRentalPeriod(prev => ({
      ...prev,
      duration: Math.max(1, prev.duration + change)
    }));
  };

  const addExtension = () => {
    const extension = {
      id: Date.now(),
      type: 'daily',
      duration: 1,
      reason: '',
      approved: false
    };
    setExtensions(prev => [...prev, extension]);
  };

  const removeExtension = (id) => {
    setExtensions(prev => prev.filter(ext => ext.id !== id));
  };

  const getPeriodLabel = () => {
    switch (rentalPeriod.type) {
      case 'hourly': return `${calculateHours()} hour${calculateHours() !== 1 ? 's' : ''}`;
      case 'daily': return `${rentalPeriod.duration} day${rentalPeriod.duration !== 1 ? 's' : ''}`;
      case 'weekly': return `${rentalPeriod.duration} week${rentalPeriod.duration !== 1 ? 's' : ''}`;
      case 'monthly': return `${rentalPeriod.duration} month${rentalPeriod.duration !== 1 ? 's' : ''}`;
      case 'custom': return `${calculateCustomDays()} day${calculateCustomDays() !== 1 ? 's' : ''} (Custom)`;
      default: return '';
    }
  };

  const getDiscountInfo = () => {
    const days = rentalPeriod.type === 'custom' ? calculateCustomDays() : rentalPeriod.duration;
    
    if (rentalPeriod.type === 'weekly') return '15% weekly discount applied';
    if (rentalPeriod.type === 'monthly') return '25% monthly discount applied';
    if (days >= 30) return '20% long-term discount applied';
    if (days >= 7) return '10% weekly discount applied';
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rental Period
          </CardTitle>
          <CardDescription>
            Choose your rental duration and get automatic discounts for longer periods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Period Type */}
          <div>
            <Label>Rental Type</Label>
            <Select value={rentalPeriod.type} onValueChange={handlePeriodTypeChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly Rental</SelectItem>
                <SelectItem value="daily">Daily Rental</SelectItem>
                <SelectItem value="weekly">Weekly Rental (15% off)</SelectItem>
                <SelectItem value="monthly">Monthly Rental (25% off)</SelectItem>
                <SelectItem value="custom">Custom Dates</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration Controls */}
          {rentalPeriod.type !== 'custom' && (
            <div>
              <Label>Duration</Label>
              <div className="flex items-center gap-3 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDurationChange(-1)}
                  disabled={rentalPeriod.duration <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[100px] text-center">
                  {rentalPeriod.duration} {rentalPeriod.type.replace('ly', '').replace('y', 'ies')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDurationChange(1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Hourly Time Selection */}
          {rentalPeriod.type === 'hourly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={rentalPeriod.startTime}
                  onChange={(e) => setRentalPeriod(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={rentalPeriod.endTime}
                  onChange={(e) => setRentalPeriod(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Custom Date Selection */}
          {rentalPeriod.type === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={rentalPeriod.startDate}
                  onChange={(e) => setRentalPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={rentalPeriod.endDate}
                  onChange={(e) => setRentalPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                  min={rentalPeriod.startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}

          {/* Period Summary */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Rental Period Summary</span>
            </div>
            <div className="text-sm text-blue-800">
              <div>Duration: {getPeriodLabel()}</div>
              {getDiscountInfo() && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="h-3 w-3" />
                  {getDiscountInfo()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Breakdown */}
      {showPricing && pricing.priceBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Pricing Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Item Details */}
              {pricing.priceBreakdown.map((item, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{item.item}</div>
                      <div className="text-sm text-gray-600">
                        {item.quantity} × KES {item.unitPrice.toLocaleString()} × {item.periodMultiplier}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">KES {item.finalAmount.toLocaleString()}</div>
                      {item.discountAmount > 0 && (
                        <div className="text-sm text-green-600">
                          -{item.discountRate * 100}% (KES {item.discountAmount.toLocaleString()})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span>Subtotal:</span>
                  <span>KES {pricing.baseAmount.toLocaleString()}</span>
                </div>
                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between items-center mb-2 text-green-600">
                    <span>Total Discount:</span>
                    <span>-KES {pricing.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>KES {pricing.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extensions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Rental Extensions
            </CardTitle>
            <Button variant="outline" size="sm" onClick={addExtension}>
              Add Extension
            </Button>
          </div>
          <CardDescription>
            Request extensions to your rental period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {extensions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No extensions requested
            </div>
          ) : (
            <div className="space-y-3">
              {extensions.map((extension) => (
                <div key={extension.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">
                        +{extension.duration} {extension.type.replace('ly', '')}
                      </div>
                      <div className="text-sm text-gray-600">
                        {extension.reason || 'No reason provided'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={extension.approved ? 'default' : 'secondary'}>
                      {extension.approved ? 'Approved' : 'Pending'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExtension(extension.id)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FlexibleRentalPeriods;
