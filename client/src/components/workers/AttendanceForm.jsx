import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const AttendanceForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
  workers, 
  loading 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Attendance</DialogTitle>
          <DialogDescription>
            Record daily attendance for a worker
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="workerId">Worker</Label>
            <Select 
              value={formData.workerId} 
              onValueChange={(value) => onFormChange('workerId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(workers) && workers.length > 0 ? (
                  workers.map(worker => (
                    <SelectItem key={worker._id} value={worker._id}>
                      {worker.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-workers" disabled>
                    No workers available. Please add workers first.
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => onFormChange('date', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="hoursWorked">Hours Worked</Label>
            <Input
              id="hoursWorked"
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={formData.hoursWorked}
              onChange={(e) => onFormChange('hoursWorked', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="taskDescription">Task Description</Label>
            <Input
              id="taskDescription"
              value={formData.taskDescription}
              onChange={(e) => onFormChange('taskDescription', e.target.value)}
              placeholder="Describe the work performed"
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => onFormChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Recording...' : 'Record Attendance'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceForm;
