import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Search, Plus, X } from 'lucide-react';

const ClientSelector = ({
  clientSearch,
  setClientSearch,
  filteredClients,
  selectedClient,
  setSelectedClient,
  onAddNewClient,
  onClearClient,
  placeholder = 'Search for a client...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    // Display individual's name with optional company name
    const displayName = client.name ? 
      `${client.contactPerson} (${client.name})` : 
      client.contactPerson;
    setClientSearch(displayName);
    setIsOpen(false);
  };

  const handleClearClient = (e) => {
    e.stopPropagation();
    setSelectedClient(null);
    setClientSearch('');
    onClearClient?.();
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={clientSearch}
          onChange={(e) => {
            setClientSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {clientSearch && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
            onClick={handleClearClient}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ScrollArea className="max-h-60 rounded-md">
            <div className="p-1">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <div
                    key={client._id}
                    className={`px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer ${
                      selectedClient?._id === client._id ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleSelectClient(client)}
                  >
                    <div className="font-medium">{client.contactPerson}</div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground">
                  <span>No clients found</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      onAddNewClient?.(clientSearch);
                      setIsOpen(false);
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add New
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default ClientSelector;
