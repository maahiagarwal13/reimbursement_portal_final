import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function Combobox({
  label,
  id,
  options = [],
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const errorId = error ? `${id}-error` : undefined;

  const selectedOption = options.find((opt) => opt.value === value);

  // Sync internal input value with selected value when dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedOption ? selectedOption.label : '');
    }
  }, [isOpen, selectedOption]);

  const filteredOptions =
    query === ''
      ? options
      : options.filter((opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase())
        );

  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setIsOpen(false);
    setQuery(options.find((opt) => opt.value === val)?.label || '');
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseInputClass = `w-full px-3 py-2 border rounded-md text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-samsung-blue focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed pr-10 ${
    error ? 'border-status-rejected focus:ring-status-rejected' : 'border-border dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
  }`;

  return (
    <div className="flex flex-col gap-1.5 relative" role="group" aria-labelledby={`${id}-label`} ref={containerRef}>
      <label
        id={`${id}-label`}
        htmlFor={id}
        className="font-mono text-[10px] uppercase tracking-wide font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1"
      >
        {label}
        {required && <span className="text-status-rejected" aria-hidden="true">*</span>}
      </label>

      <div className="relative">
        <input
          id={id}
          type="text"
          ref={inputRef}
          value={isOpen ? query : (selectedOption ? selectedOption.label : '')}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          required={required && !value}
          className={baseInputClass}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
        />
        
        {/* Dropdown Icon */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen);
              if (!isOpen) inputRef.current?.focus();
            }
          }}
          className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          tabIndex={-1}
        >
          <ChevronDown size={16} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <ul
            id={`${id}-listbox`}
            className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-border dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-auto text-sm focus:outline-none"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm italic select-none">No options found.</li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between select-none ${
                      isHighlighted ? 'bg-blue-50 dark:bg-blue-900/30 text-samsung-blue dark:text-blue-400' : 'text-gray-900 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className={isSelected ? 'font-medium' : 'font-normal'}>{opt.label}</span>
                    {isSelected && <Check size={16} className="text-samsung-blue" />}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {error && (
        <span id={errorId} className="text-xs text-status-rejected font-medium" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
