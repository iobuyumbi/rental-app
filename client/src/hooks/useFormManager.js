import { useState, useCallback } from 'react';

/**
 * Custom hook for managing form state and validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @param {Function} onSubmit - Submit handler function
 */
const useFormManager = (initialValues = {}, validationRules = {}, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update a single field value
  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // Update multiple field values
  const updateValues = useCallback((newValues) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Mark field as touched
  const markTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);

  // Validate a single field
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${rules.label || name} is required`;
    }

    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength) {
      return `${rules.label || name} must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength) {
      return `${rules.label || name} must be no more than ${rules.maxLength} characters`;
    }

    // Email validation
    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    // Number validation
    if (rules.number && value) {
      if (isNaN(value)) {
        return `${rules.label || name} must be a number`;
      }
      if (rules.min !== undefined && Number(value) < rules.min) {
        return `${rules.label || name} must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && Number(value) > rules.max) {
        return `${rules.label || name} must be no more than ${rules.max}`;
      }
    }

    // Custom validation
    if (rules.validate && typeof rules.validate === 'function') {
      return rules.validate(value, values);
    }

    return null;
  }, [validationRules, values]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationRules, values, validateField]);

  // Handle field change
  const handleChange = useCallback((name, value) => {
    setValue(name, value);
    
    // Validate field if it's been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [setValue, touched, validateField]);

  // Handle field blur
  const handleBlur = useCallback((name) => {
    setTouched(name, true);
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(validationRules).forEach(name => {
      allTouched[name] = true;
    });
    setTouched(allTouched);

    // Validate form
    if (!validateForm()) {
      return false;
    }

    if (!onSubmit) return true;

    try {
      setIsSubmitting(true);
      await onSubmit(values);
      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validationRules, validateForm, onSubmit]);

  // Reset form
  const reset = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Get field props for easy binding
  const getFieldProps = useCallback((name) => ({
    value: values[name] || '',
    onChange: (e) => {
      const value = e.target ? e.target.value : e;
      handleChange(name, value);
    },
    onBlur: () => handleBlur(name),
    error: touched[name] ? errors[name] : null
  }), [values, handleChange, handleBlur, touched, errors]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    updateValues,
    markTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    validateForm,
    reset,
    getFieldProps,
    isValid: Object.keys(errors).length === 0
  };
};

export { useFormManager };
export default useFormManager;
