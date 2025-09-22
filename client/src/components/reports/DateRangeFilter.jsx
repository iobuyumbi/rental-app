import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const DateRangeFilter = ({ dateRange, onDateRangeChange, onApplyFilter }) => {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="startDate" className="text-sm">From:</Label>
      <Input
        id="startDate"
        type="date"
        value={dateRange.startDate}
        onChange={(e) => onDateRangeChange('startDate', e.target.value)}
        className="w-auto"
      />
      <Label htmlFor="endDate" className="text-sm">To:</Label>
      <Input
        id="endDate"
        type="date"
        value={dateRange.endDate}
        onChange={(e) => onDateRangeChange('endDate', e.target.value)}
        className="w-auto"
      />
      <Button onClick={onApplyFilter} variant="outline" size="sm">
        Apply Filter
      </Button>
    </div>
  );
};

export default DateRangeFilter;
