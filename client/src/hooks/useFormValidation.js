import { useState } from 'react';

const useFormValidation = (initialData, validationRules = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (key, value) => {
    const rules = validationRules[key];
    if (!rules) return null;

    if (rules.required && (!value || value.toString().trim() === '')) {
      return `${rules.label || key} is required`;
    }

    if (rules.min && parseFloat(value) < rules.min) {
      return `${rules.label || key} must be at least ${rules.min}`;
    }

    if (rules.max && parseFloat(value) > rules.max) {
      return `${rules.label || key} must be at most ${rules.max}`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || `${rules.label || key} format is invalid`;
    }

    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const resetForm = (newData = initialData) => {
    setFormData(newData);
    setErrors({});
    setIsSubmitting(false);
  };

  const handleSubmit = async (submitFunction) => {
    if (!validateForm()) {
      return false;
    }

    setIsSubmitting(true);
    try {
      await submitFunction(formData);
      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    resetForm,
    validateForm,
    handleSubmit,
    setFormData
  };
};

export default useFormValidation;
