import React from 'react';

export default function Badge({ status, children }) {
  const label = children || status;
  
  let dotColor = 'bg-gray-400';
  let textColor = 'text-gray-600';

  if (status === 'pending') {
    dotColor = 'bg-status-pending';
    textColor = 'text-status-pending';
  } else if (status === 'approved') {
    dotColor = 'bg-status-approved';
    textColor = 'text-status-approved';
  } else if (status === 'rejected') {
    dotColor = 'bg-status-rejected';
    textColor = 'text-status-rejected';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide font-semibold ${textColor}`} aria-label={`Status: ${status}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {label}
    </span>
  );
}
