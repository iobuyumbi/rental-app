import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { handleError } from '../utils/errorHandling.jsx';

/**
 * Enhanced Client Management Hook
 * Comprehensive logic for client selection, search, syncing, and creation.
 * * @param {Array<Object>} clientOptions - Full list of available clients.
 * @param {Function} onAddNewClient - Parent component function to persist a new client.
 * @param {Function} onFormChange - Parent component function to update the main form data (e.g., set client ID).
 * @param {string} initialClientId - ID of the client initially selected (e.g., when editing an order).
 */
const useClientManagement = (clientOptions = [], onAddNewClient, onFormChange, initialClientId) => {
  // Client selection state
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [filteredClients, setFilteredClients] = useState([]);
    
  // Client creation modal state
  const [showClientModal, setShowClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    type: 'direct',
    status: 'active',
    notes: ''
  });
  const [clientFormErrors, setClientFormErrors] = useState({});
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // --- Core Logic ---

  // 1. Filter clients based on search term
  useEffect(() => {
    const clients = clientOptions || [];
    if (!clientSearch) {
      setFilteredClients(clients);
      return;
    }
      
    const searchTerm = clientSearch.toLowerCase();
    const filtered = clients.filter(
      client => 
        (client.contactPerson && client.contactPerson.toLowerCase().includes(searchTerm)) ||
        (client.name && client.name.toLowerCase().includes(searchTerm)) ||
        (client.phone && client.phone.toLowerCase().includes(searchTerm))
    );
    setFilteredClients(filtered);
  }, [clientSearch, clientOptions]);

  // 2. Sync selected client state with initialClientId prop
  useEffect(() => {
    if (initialClientId && clientOptions.length > 0) { // Check length to ensure options are loaded
      const client = clientOptions.find(c => c._id === initialClientId);
      if (client && selectedClient?._id !== initialClientId) { // Check if already selected
        setSelectedClient(client);
        // Set search display name
        const displayName = client.name ? 
          `${client.contactPerson} (${client.name})` : 
          client.contactPerson;
        setClientSearch(displayName);
      }
    } else if (!initialClientId && selectedClient) {
      setSelectedClient(null);
      setClientSearch('');
    }
    // Only re-run if initialClientId or the full list changes
  }, [initialClientId, clientOptions, selectedClient?._id]); 

  // 3. Notify parent form when selection changes (client ID)
  useEffect(() => {
    if (onFormChange) {
      onFormChange('client', selectedClient?._id || '');
    }
  }, [selectedClient, onFormChange]);

  // --- Action Handlers (useCallback for stability) ---

  const validateClientForm = useCallback(() => {
    const errors = {};
    const data = newClientData;

    if (!data.contactPerson.trim()) errors.contactPerson = 'Contact person is required';
    if (!data.email.trim()) errors.email = 'Email is required';
    if (!data.phone.trim()) errors.phone = 'Phone is required';
    if (!data.address.trim()) errors.address = 'Address is required';
      
    // Basic email format validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (data.email && !emailRegex.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }
      
    return errors;
  }, [newClientData]);

  const closeClientModal = useCallback(() => {
    setShowClientModal(false);
    // Reset form data and errors when closing
    setNewClientData({
      name: '', contactPerson: '', email: '', phone: '', address: '',
      type: 'direct', status: 'active', notes: ''
    });
    setClientFormErrors({});
  }, []);

  const clearClientSelection = useCallback(() => {
    setSelectedClient(null);
    setClientSearch('');
    if (onFormChange) {
      onFormChange('client', '');
    }
  }, [onFormChange]);

  const handleClientSelect = useCallback((client) => {
    setSelectedClient(client);
    const displayName = client.name ? 
      `${client.contactPerson} (${client.name})` : 
      client.contactPerson;
    setClientSearch(displayName);
      
    toast.success(`Selected client: ${client.contactPerson}`);
  }, []);

  const handleAddNewClient = useCallback((searchTerm = '') => {
    setNewClientData(prev => ({ 
      ...prev, 
      name: searchTerm || '', 
      contactPerson: searchTerm || '' 
    }));
    setClientFormErrors({});
    setShowClientModal(true);
  }, []);

  const handleClientFormChange = useCallback((field, value) => {
    setNewClientData(prev => ({ ...prev, [field]: value }));
    // Clear specific error when user starts typing
    if (clientFormErrors[field]) {
      setClientFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [clientFormErrors]);

  const handleClientSubmit = async (e) => {
    e.preventDefault();
      
    const errors = validateClientForm();
    if (Object.keys(errors).length > 0) {
      setClientFormErrors(errors);
      return;
    }
      
    setIsCreatingClient(true);
    try {
      const newClient = await onAddNewClient(newClientData); 
      
      if (newClient) {
        closeClientModal();
        handleClientSelect(newClient);
        toast.success(`Client ${newClient.contactPerson} created successfully!`);
      }
    } catch (error) {
      console.error('Error creating client:', error);
        
      const parsedError = handleError(error, {
        context: 'Creating client',
        showToast: false 
      });
        
      if (parsedError.message.includes('Email already exists') || 
          parsedError.message.includes('Duplicate field value')) {
        setClientFormErrors({ email: 'This email address is already in use.' });
        toast.error('Email address already exists');
      } else {
        setClientFormErrors({ general: parsedError.message });
        toast.error(`Failed to create client: ${parsedError.message}`);
      }
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleSearchChange = useCallback((value) => {
    setClientSearch(value);
    // Clear selection if the input value no longer matches the selected client's display name
    if (selectedClient) {
      const currentDisplayName = selectedClient.name ? 
        `${selectedClient.contactPerson} (${selectedClient.name})` : 
        selectedClient.contactPerson;
        
      if (value !== currentDisplayName) {
        clearClientSelection();
      }
    }
  }, [selectedClient, clearClientSelection]);

  const resetClientState = useCallback(() => {
    clearClientSelection();
    closeClientModal();
  }, [clearClientSelection, closeClientModal]);

  return {
    // Client selection state
    clientSearch,
    setClientSearch: handleSearchChange,
    selectedClient,
    filteredClients,
      
    // Client selection actions
    handleClientSelect,
    clearClientSelection,
      
    // Client creation state
    showClientModal,
    newClientData,
    clientFormErrors,
    isCreatingClient,
      
    // Client creation actions
    handleAddNewClient,
    handleClientFormChange,
    handleClientSubmit,
    closeClientModal,
      
    // Utility actions
    resetClientState,
  };
};

export default useClientManagement;
