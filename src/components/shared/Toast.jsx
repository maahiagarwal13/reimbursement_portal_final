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
  
  let colorClass = 'bg-blue-50 text-blue-800 border-blue-200';
  let iconColor = 'text-blue-500';
  
  if (type === 'success') {
    colorClass = 'bg-green-50 text-green-800 border-green-200';
    iconColor = 'text-green-500';
  } else if (type === 'error') {
    colorClass = 'bg-red-50 text-red-800 border-red-200';
    iconColor = 'text-red-500';
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`flex items-start gap-3 p-4 border rounded-md shadow-md ${colorClass} max-w-sm w-full`}
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
          className={`flex-shrink-0 rounded-md p-0.5 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${colorClass.split(' ')[0].replace('bg-', '')} focus:ring-${iconColor.split('-')[1]}-500`}
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
