import React, { useEffect, useRef, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ICON_MAP = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const AUTO_DISMISS_MS = 4000;

export default function Toast({ message, type = 'info', isVisible, onClose }) {
  const timerRef = useRef(null);
  const Icon = ICON_MAP[type] || Info;

  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => {
      onClose();
    }, AUTO_DISMISS_MS);
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isVisible, startTimer]);

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleMouseLeave = () => {
    startTimer();
  };

  if (!isVisible) return null;

  const ariaRole = type === 'error' ? 'alert' : 'status';
  
  let colorClass = 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 shadow-lg';
  let iconColor = 'text-blue-500';
  
  if (type === 'success') {
    iconColor = 'text-status-approved';
  } else if (type === 'error') {
    iconColor = 'text-status-rejected';
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-start gap-3 p-4 border rounded-md ${colorClass} max-w-sm w-full`}
        role={ariaRole}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Icon className={`flex-shrink-0 mt-0.5 ${iconColor}`} size={18} aria-hidden="true" />
        <div className="flex-1 text-sm font-medium">
          {message}
        </div>
        <button
          type="button"
          className="flex-shrink-0 rounded-md p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
