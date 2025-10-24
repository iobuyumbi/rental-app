import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Search, Plus, X, UserPlus } from 'lucide-react';

const ClientSelector = ({
  clientSearch,
  setClientSearch,
  filteredClients,
  selectedClient,
  setSelectedClient,
  onAddNewClient,
  onClearClient,
  placeholder = 'Search client by name or phone...'
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Smart dropdown visibility logic from sample
  useEffect(() => {
    // Only show dropdown if there's search text and a selection hasn't been made, 
    // or if search text doesn't match selected client
    if (selectedClient && clientSearch) {
      const displayName = selectedClient.name ? 
        `${selectedClient.contactPerson} (${selectedClient.name})` : 
        selectedClient.contactPerson;
      if (clientSearch.trim() !== displayName.trim()) {
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    } else if (clientSearch.trim() !== '') {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [clientSearch, selectedClient]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (client) => {
    setSelectedClient(client);
    const displayName = client.name ? 
      `${client.contactPerson} (${client.name})` : 
      client.contactPerson;
    setClientSearch(displayName);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSelectedClient(null);
    setClientSearch('');
    onClearClient?.();
    setShowDropdown(true); // Re-open dropdown/prompt for search
  };

  const handleSearchChange = (e) => {
    setClientSearch(e.target.value);
    setSelectedClient(null);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={clientSearch}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="flex-grow p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 border-gray-300"
        />
        {selectedClient ? (
          <Button variant="secondary" onClick={handleClear} title="Clear Selection">
            <X className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="outline" onClick={() => onAddNewClient(clientSearch)} title="Add New Client">
            <UserPlus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto" ref={dropdownRef}>
          {filteredClients.length > 0 ? (
            filteredClients.map(client => (
              <div
                key={client._id}
                className="p-3 cursor-pointer hover:bg-blue-50 transition-colors border-b last:border-b-0"
                onClick={() => handleSelect(client)}
              >
                <p className="font-semibold">
                  {client.contactPerson} 
                  {client.name && <span className="text-gray-500 text-sm"> ({client.name})</span>}
                </p>
                <p className="text-xs text-gray-500">{client.email} | {client.phone}</p>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500 text-sm">
              No clients found. <button onClick={() => onAddNewClient(clientSearch)} className="text-blue-600 underline">Add new?</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientSelector;
