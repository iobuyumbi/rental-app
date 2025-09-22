import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const WorkerForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
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
          <DialogTitle>Add New Worker</DialogTitle>
          <DialogDescription>
            Register a new worker in the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onFormChange('name', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => onFormChange('phone', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="nationalId">National ID</Label>
            <Input
              id="nationalId"
              value={formData.nationalId}
              onChange={(e) => onFormChange('nationalId', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="dailyRate">Daily Rate (KES)</Label>
            <Input
              id="dailyRate"
              type="number"
              min="0"
              step="0.01"
              value={formData.dailyRate}
              onChange={(e) => onFormChange('dailyRate', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="skills">Skills/Specialization</Label>
            <Input
              id="skills"
              value={formData.skills}
              onChange={(e) => onFormChange('skills', e.target.value)}
              placeholder="e.g., Cleaning, Setup, Technical"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Worker'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkerForm;
