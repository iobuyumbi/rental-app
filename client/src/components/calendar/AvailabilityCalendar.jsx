import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  Users,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const AvailabilityCalendar = ({ 
  products = [], 
  orders = [], 
  selectedProduct = null,
  onDateSelect,
  onProductSelect 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [calendarData, setCalendarData] = useState({});

  useEffect(() => {
    generateCalendarData();
  }, [currentDate, products, orders, selectedProduct]);

  const generateCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const data = {};

    // Generate data for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      data[dateString] = {
        date,
        availability: calculateAvailability(date),
        orders: getOrdersForDate(date),
        isToday: isToday(date),
        isPast: date < new Date().setHours(0, 0, 0, 0)
      };
    }

    setCalendarData(data);
  };

  const calculateAvailability = (date) => {
    if (!selectedProduct) {
      // Show overall availability across all products
      const totalStock = products.reduce((sum, product) => sum + (product.quantityInStock || 0), 0);
      const totalRented = getActiveRentalsForDate(date);
      const available = totalStock - totalRented;
      
      return {
        total: totalStock,
        available,
        rented: totalRented,
        utilizationRate: totalStock > 0 ? (totalRented / totalStock) * 100 : 0
      };
    } else {
      // Show availability for specific product
      const activeRentals = getActiveRentalsForProduct(selectedProduct._id, date);
      const available = (selectedProduct.quantityInStock || 0) - activeRentals;
      
      return {
        total: selectedProduct.quantityInStock || 0,
        available,
        rented: activeRentals,
        utilizationRate: selectedProduct.quantityInStock > 0 ? (activeRentals / selectedProduct.quantityInStock) * 100 : 0
      };
    }
  };

  const getActiveRentalsForDate = (date) => {
    return orders.reduce((total, order) => {
      if (order.status === 'in_progress' && isDateInRange(date, order.rentalStartDate, order.rentalEndDate)) {
        return total + (order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0);
      }
      return total;
    }, 0);
  };

  const getActiveRentalsForProduct = (productId, date) => {
    return orders.reduce((total, order) => {
      if (order.status === 'in_progress' && isDateInRange(date, order.rentalStartDate, order.rentalEndDate)) {
        const productItem = order.items?.find(item => 
          (item.product?._id || item.product) === productId
        );
        return total + (productItem?.quantity || 0);
      }
      return total;
    }, 0);
  };

  const getOrdersForDate = (date) => {
    return orders.filter(order => 
      isDateInRange(date, order.rentalStartDate, order.rentalEndDate)
    );
  };

  const isDateInRange = (date, startDate, endDate) => {
    const checkDate = new Date(date).setHours(0, 0, 0, 0);
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(0, 0, 0, 0);
    return checkDate >= start && checkDate <= end;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getAvailabilityColor = (availability) => {
    if (availability.available === 0) return 'bg-red-100 border-red-300';
    if (availability.utilizationRate > 80) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  const getAvailabilityIcon = (availability) => {
    if (availability.available === 0) return <AlertTriangle className="h-3 w-3 text-red-600" />;
    if (availability.utilizationRate > 80) return <Clock className="h-3 w-3 text-yellow-600" />;
    return <CheckCircle className="h-3 w-3 text-green-600" />;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (dateString, dayData) => {
    if (dayData.isPast) return;
    
    setSelectedDates(prev => {
      const isSelected = prev.includes(dateString);
      const newSelection = isSelected 
        ? prev.filter(d => d !== dateString)
        : [...prev, dateString];
      
      if (onDateSelect) {
        onDateSelect(newSelection);
      }
      
      return newSelection;
    });
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-20"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = new Date(year, month, day).toISOString().split('T')[0];
      const dayData = calendarData[dateString];
      
      if (dayData) {
        const isSelected = selectedDates.includes(dateString);
        
        days.push(
          <div
            key={day}
            onClick={() => handleDateClick(dateString, dayData)}
            className={`
              h-20 border rounded-lg p-2 cursor-pointer transition-all
              ${dayData.isPast ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
              ${isSelected ? 'ring-2 ring-blue-500' : ''}
              ${getAvailabilityColor(dayData.availability)}
            `}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-sm font-medium ${dayData.isToday ? 'text-blue-600' : ''}`}>
                {day}
              </span>
              {getAvailabilityIcon(dayData.availability)}
            </div>
            
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="font-medium">{dayData.availability.available}</span>
              </div>
              <div className="flex justify-between">
                <span>Rented:</span>
                <span className="font-medium">{dayData.availability.rented}</span>
              </div>
            </div>
            
            {dayData.orders.length > 0 && (
              <div className="mt-1">
                <Badge variant="secondary" className="text-xs">
                  {dayData.orders.length} order{dayData.orders.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>
        );
      }
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Selection
          </CardTitle>
          <CardDescription>
            Select a product to view its availability or view overall availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedProduct ? "default" : "outline"}
              size="sm"
              onClick={() => onProductSelect?.(null)}
            >
              All Products
            </Button>
            {products.map(product => (
              <Button
                key={product._id}
                variant={selectedProduct?._id === product._id ? "default" : "outline"}
                size="sm"
                onClick={() => onProductSelect?.(product)}
              >
                {product.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Availability Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[150px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            {selectedProduct 
              ? `Viewing availability for ${selectedProduct.name}`
              : 'Viewing overall inventory availability'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {renderCalendarDays()}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>High Demand</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Fully Booked</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Dates Summary */}
      {selectedDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedDates.map(dateString => (
                <Badge key={dateString} variant="secondary">
                  {new Date(dateString).toLocaleDateString()}
                </Badge>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedDates([])}
              className="mt-3"
            >
              Clear Selection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AvailabilityCalendar;
