import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  Download,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

const ViolationFilters = ({
  filters,
  onFiltersChange,
  onExport,
  onRefresh,
  loading = false
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: filters.dateFrom || null,
    to: filters.dateTo || null
  });

  const violationTypes = [
    'Overdue Return',
    'Damaged Item', 
    'Missing Item',
    'Late Payment',
    'Contract Violation'
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const penaltyRanges = [
    { value: 'all', label: 'All Amounts' },
    { value: '0-1000', label: 'KES 0 - 1,000' },
    { value: '1000-5000', label: 'KES 1,000 - 5,000' },
    { value: '5000-10000', label: 'KES 5,000 - 10,000' },
    { value: '10000+', label: 'KES 10,000+' }
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    onFiltersChange({
      ...filters,
      dateFrom: range.from,
      dateTo: range.to
    });
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      type: 'all',
      status: 'all',
      penaltyRange: 'all',
      dateFrom: null,
      dateTo: null,
      clientId: 'all'
    };
    setDateRange({ from: null, to: null });
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type && filters.type !== 'all') count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.penaltyRange && filters.penaltyRange !== 'all') count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.clientId && filters.clientId !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search and Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search violations by description, client, order..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="relative"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                onClick={onExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Violation Type */}
                <div>
                  <Label>Violation Type</Label>
                  <Select
                    value={filters.type || 'all'}
                    onValueChange={(value) => handleFilterChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {violationTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <Label>Status</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Penalty Range */}
                <div>
                  <Label>Penalty Amount</Label>
                  <Select
                    value={filters.penaltyRange || 'all'}
                    onValueChange={(value) => handleFilterChange('penaltyRange', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {penaltyRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div>
                  <Label>Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange.from}
                        selected={dateRange}
                        onSelect={handleDateRangeChange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  
                  {filters.search && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {filters.search}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange('search', '')}
                      />
                    </Badge>
                  )}
                  
                  {filters.type && filters.type !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Type: {filters.type}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange('type', 'all')}
                      />
                    </Badge>
                  )}
                  
                  {filters.status && filters.status !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {filters.status}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange('status', 'all')}
                      />
                    </Badge>
                  )}
                  
                  {filters.penaltyRange && filters.penaltyRange !== 'all' && (
                    <Badge variant="secondary" className="gap-1">
                      Amount: {penaltyRanges.find(r => r.value === filters.penaltyRange)?.label}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleFilterChange('penaltyRange', 'all')}
                      />
                    </Badge>
                  )}
                  
                  {(filters.dateFrom || filters.dateTo) && (
                    <Badge variant="secondary" className="gap-1">
                      Date Range
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleDateRangeChange({ from: null, to: null })}
                      />
                    </Badge>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ViolationFilters;
