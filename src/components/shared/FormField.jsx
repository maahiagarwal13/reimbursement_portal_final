import React from 'react';

export default function FormField({
  label,
  id,
  type = 'text',
  error,
  required = false,
  children,
  placeholder,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  helpText,
  className = '',
  ...rest
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;
  
  const baseInputClass = `w-full px-3 py-2 border rounded-md text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-samsung-blue focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
    error ? 'border-status-rejected focus:ring-status-rejected' : 'border-border hover:border-gray-400'
  } ${readOnly ? 'bg-gray-50' : ''}`;

  const commonProps = {
    id,
    value,
    onChange,
    disabled,
    placeholder,
    required,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    ...rest,
  };

  const renderInput = () => {
    if (type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          readOnly={readOnly}
          className={`${baseInputClass} min-h-[80px] resize-y`}
        />
      );
    }

    if (type === 'select') {
      return (
        <select
          {...commonProps}
          className={`${baseInputClass} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%224%206%208%2010%2012%206%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
      );
    }

    return (
      <input
        {...commonProps}
        type={type}
        readOnly={readOnly}
        className={baseInputClass}
      />
    );
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="font-mono text-[10px] uppercase tracking-wide font-semibold text-gray-700 flex items-center gap-1"
      >
        {label}
        {required && <span className="text-status-rejected" aria-hidden="true">*</span>}
      </label>

      {renderInput()}

      {error && (
        <span id={errorId} className="text-xs text-status-rejected font-medium" role="alert">
          {error}
        </span>
      )}

      {helpText && !error && (
        <span id={helpId} className="text-xs text-gray-500">
          {helpText}
        </span>
      )}
    </div>
  );
}
