import React from 'react';

export default function Select({
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
  const errorId = error ? `${id}-error` : undefined;

  const baseInputClass = `w-full px-3 py-2 border rounded-md text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-samsung-blue focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%224%206%208%2010%2012%206%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${
    error ? 'border-status-rejected focus:ring-status-rejected' : 'border-border dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
  }`;

  return (
    <div className="flex flex-col gap-1.5" role="group" aria-labelledby={`${id}-label`}>
      <label
        id={`${id}-label`}
        htmlFor={id}
        className="font-mono text-[10px] uppercase tracking-wide font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1"
      >
        {label}
        {required && <span className="text-status-rejected" aria-hidden="true">*</span>}
      </label>

      <div>
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={baseInputClass}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <span id={errorId} className="text-xs text-status-rejected font-medium" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
