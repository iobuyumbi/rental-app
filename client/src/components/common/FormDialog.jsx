import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

const FormDialog = ({
  isOpen,
  onOpenChange,
  title,
  description,
  trigger,
  formData,
  onFormChange,
  onSubmit,
  fields,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isEditing = false
}) => {
  const handleInputChange = (key, value) => {
    onFormChange({ ...formData, [key]: value });
  };

  const renderField = (field) => {
    const { key, label, type, placeholder, options, required, rows } = field;
    
    switch (type) {
      case 'select':
        return (
          <Select
            value={formData[key] || ''}
            onValueChange={(value) => handleInputChange(key, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'textarea':
        return (
          <Textarea
            value={formData[key] || ''}
            onChange={(e) => handleInputChange(key, e.target.value)}
            placeholder={placeholder}
            rows={rows || 3}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={formData[key] || ''}
            onChange={(e) => handleInputChange(key, e.target.value)}
            placeholder={placeholder}
            step="0.01"
            min="0"
          />
        );
      
      default:
        return (
          <Input
            type={type || 'text'}
            value={formData[key] || ''}
            onChange={(e) => handleInputChange(key, e.target.value)}
            placeholder={placeholder}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}
          
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button type="submit">
              {isEditing ? `Update ${submitLabel}` : `Create ${submitLabel}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
