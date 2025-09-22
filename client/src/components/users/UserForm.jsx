import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Eye, EyeOff } from 'lucide-react';

const UserForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  onFormChange, 
  isEditing = false,
  showPassword,
  setShowPassword
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update user information and permissions' : 'Create a new system user account'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={isEditing ? "editFirstName" : "firstName"}>First Name</Label>
              <Input
                id={isEditing ? "editFirstName" : "firstName"}
                value={formData.firstName}
                onChange={(e) => onFormChange({ firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor={isEditing ? "editLastName" : "lastName"}>Last Name</Label>
              <Input
                id={isEditing ? "editLastName" : "lastName"}
                value={formData.lastName}
                onChange={(e) => onFormChange({ lastName: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor={isEditing ? "editUsername" : "username"}>Username</Label>
            <Input
              id={isEditing ? "editUsername" : "username"}
              value={formData.username}
              onChange={(e) => onFormChange({ username: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor={isEditing ? "editEmail" : "email"}>Email</Label>
            <Input
              id={isEditing ? "editEmail" : "email"}
              type="email"
              value={formData.email}
              onChange={(e) => onFormChange({ email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor={isEditing ? "editPhone" : "phone"}>Phone Number</Label>
            <Input
              id={isEditing ? "editPhone" : "phone"}
              value={formData.phone}
              onChange={(e) => onFormChange({ phone: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor={isEditing ? "editRole" : "role"}>Role</Label>
            <Select value={formData.role} onValueChange={(value) => onFormChange({ role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Administrator</SelectItem>
                <SelectItem value="AdminAssistant">Admin Assistant</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {!isEditing && (
            <>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => onFormChange({ password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => onFormChange({ confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          {isEditing && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={formData.isActive}
                onChange={(e) => onFormChange({ isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="editIsActive">Account is active</Label>
            </div>
          )}

          <Button type="submit" className="w-full">
            {isEditing ? 'Update User' : 'Create User'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
