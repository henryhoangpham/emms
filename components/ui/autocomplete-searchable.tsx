import React, { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Option {
  id: string | number;
  label: string;
  [key: string]: any; // Allow for additional properties
}

interface SearchableSelectProps {
  options?: Option[];
  value?: string | number;
  onChange: (value: string | number) => void;
  onSearch?: (term: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noOptionsMessage?: string;
  loadingMessage?: string;
  isLoading?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  onSearch,
  placeholder = 'Select an option',
  searchPlaceholder = 'Type to search...',
  noOptionsMessage = 'No options found',
  loadingMessage = 'Loading...',
  isLoading = false,
  disabled = false,
  error,
  className = ''
}: SearchableSelectProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Handle search input change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch?.(term);
  };

  // Handle selection change
  const handleSelectionChange = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  // Find selected option label
  const selectedLabel = useMemo(() => {
    const selected = options.find(option => option.id.toString() === value.toString());
    return selected?.label || '';
  }, [options, value]);

  return (
    <div className={`w-full ${className}`}>
      <Select
        value={value?.toString()}
        onValueChange={handleSelectionChange}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className={`w-full ${error ? 'border-red-500' : ''}`}>
          <SelectValue placeholder={placeholder}>
            {selectedLabel || placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-2">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearch}
              className="mb-2"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <SelectItem
                  key={option.id}
                  value={option.id.toString()}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {option.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-results" disabled>
                {isLoading ? loadingMessage : noOptionsMessage}
              </SelectItem>
            )}
          </div>
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default SearchableSelect;