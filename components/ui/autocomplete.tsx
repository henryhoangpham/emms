'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/utils/cn';

interface Option {
  id: string;
  name: string;
}

interface AutocompleteProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Search...",
  className
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Find and set the selected option based on value prop
    if (value) {
      const option = options.find(opt => opt.id === value);
      if (option) {
        setSelectedOption(option);
        setSearchTerm(option.name);
      }
    }
  }, [value, options]);

  useEffect(() => {
    // Handle click outside to close dropdown
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (!e.target.value) {
      setSelectedOption(null);
      onChange('');
    }
  };

  const handleOptionClick = (option: Option) => {
    setSelectedOption(option);
    setSearchTerm(option.name);
    onChange(option.id);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <Input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option) => (
            <div
              key={option.id}
              className={cn(
                "px-4 py-2 cursor-pointer hover:bg-muted",
                selectedOption?.id === option.id && "bg-muted"
              )}
              onClick={() => handleOptionClick(option)}
            >
              {option.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
