import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing form state, client-side validation, and submission.
 * This hook standardizes form operations and reduces boilerplate in components.
 * * @param {Object} initialValues - Initial form values (e.g., { name: '', email: '' }).
 * @param {Object} validationRules - Validation rules for each field.
 * @param {Function} onSubmit - Submit handler function: async (values) => void.
 * @returns {Object} Form state, handlers, and utilities.
 */
const useFormManager = (initialValues = {}, validationRules = {}, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetKey, setResetKey] = useState(Date.now()); // Used to force full reset if needed

  // --- Utility Functions (Internal State Management) ---

  // Purely updates a single field value
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear the specific error immediately on change for better UX
    setErrors(prev => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Updates multiple field values
  const updateValues = useCallback((newValues) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Marks field as touched
  const markTouched = useCallback((name, isTouched = true) => {
    setTouched(prev => ({ ...prev, [name]: isTouched }));
  }, []);


  // --- Validation Logic ---

  /**
   * Validates a single field against the provided rules.
   * * NOTE: This function depends on 'values' for cross-field validation, 
   * * so it must be memoized with 'values' in its dependency array.
   */
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${rules.label || name} is required`;
    }

    // Min/Max length validation (for strings/arrays)
    if (value && typeof value.length === 'number') {
      if (rules.minLength && value.length < rules.minLength) {
        return `${rules.label || name} must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return `${rules.label || name} must be no more than ${rules.maxLength} characters`;
      }
    }

    // Email validation
    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    // Number validation
    if (rules.number && (value !== null && value !== undefined && value !== '')) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${rules.label || name} must be a number`;
      }
      if (rules.min !== undefined && numValue < rules.min) {
        return `${rules.label || name} must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && numValue > rules.max) {
        return `${rules.label || name} must be no more than ${rules.max}`;
      }
    }

    // Custom validation (passes current values for cross-field comparison)
    if (rules.validate && typeof rules.validate === 'function') {
      return rules.validate(value, values);
    }

    return null;
  }, [validationRules, values]); // Recalculates when values change for cross-field validation

  // Validates all fields and updates the error state
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    // Iterate over all fields defined in validation rules
    Object.keys(validationRules).forEach(name => {
      // Use the memoized validateField, which uses the latest 'values' state
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validationRules, values, validateField]);

  // --- Event Handlers ---

  const handleChange = useCallback((name, value) => {
    setFieldValue(name, value);
    
    // Only re-validate if the field has already been blurred/touched
    // This prevents showing an error immediately after typing the first character
    if (touched[name]) {
      // Use the new value for validation
      const error = validateField(name, value); 
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, setFieldValue, validateField]);

  const handleBlur = useCallback((name) => {
    markTouched(name, true);
    // Validate on blur to display the error
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [markTouched, validateField, values]);


  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // 1. Mark all fields as touched to trigger validation UI
    const allTouched = Object.keys(validationRules).reduce((acc, name) => ({ ...acc, [name]: true }), {});
    setTouched(allTouched);

    // 2. Validate the form using the latest state
    if (!validateForm()) {
      return false;
    }

    if (!onSubmit) return true;

    // 3. Submit
    try {
      setIsSubmitting(true);
      await onSubmit(values);
      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      // Re-throw or handle error setting specific form errors if needed
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validationRules, validateForm, onSubmit]);

  // Reset form to initial state
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setResetKey(Date.now()); // Update key to force component remounts if using external keys
  }, [initialValues]);

  // --- Prop Binding Utility ---

  /**
   * Returns an object containing the necessary props for binding to an input component.
   */
  const getFieldProps = useCallback((name) => {
    const value = values[name] || '';
    
    // Determine the error message to display (only show if touched)
    const displayError = touched[name] ? errors[name] : null;

    return {
      name,
      value,
      onChange: (e) => {
        // Handles standard synthetic event (e.target.value) and custom component change events (e.g., just the value)
        const newValue = e && e.target ? e.target.value : e;
        handleChange(name, newValue);
      },
      onBlur: () => handleBlur(name),
      error: displayError,
      isInvalid: !!displayError,
    };
  }, [values, handleChange, handleBlur, touched, errors]);

  // Determine if the entire form is currently valid (memoized)
  const isValid = useMemo(() => Object.keys(errors).every(key => !errors[key]), [errors]);

  return {
    // State
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    resetKey, // Useful for forcing component resets

    // Value Management Actions
    setFieldValue, // Use for non-event value changes (e.g., reset)
    updateValues,
    markTouched,

    // Event Handlers
    handleChange,
    handleBlur,
    handleSubmit,

    // Utilities
    validateForm,
    reset,
    getFieldProps,
  };
};

export { useFormManager };
export default useFormManager;
