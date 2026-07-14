import React, { useState, useEffect } from 'react';

export default function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeRequests, setActiveRequests] = useState(0);

  useEffect(() => {
    const handleStart = () => setActiveRequests((prev) => prev + 1);
    const handleEnd = () => setActiveRequests((prev) => Math.max(0, prev - 1));

    window.addEventListener('api-request-start', handleStart);
    window.addEventListener('api-request-end', handleEnd);

    return () => {
      window.removeEventListener('api-request-start', handleStart);
      window.removeEventListener('api-request-end', handleEnd);
    };
  }, []);

  useEffect(() => {
    // Add a slight delay before showing the loader to prevent flickering on fast requests
    let timeout;
    if (activeRequests > 0) {
      timeout = setTimeout(() => {
        setIsLoading(true);
      }, 300); // 300ms delay
    } else {
      setIsLoading(false);
    }
    
    return () => clearTimeout(timeout);
  }, [activeRequests]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px] transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-xl flex flex-col items-center border border-gray-100 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
        <div className="relative flex justify-center items-center w-12 h-12">
          <div className="absolute w-12 h-12 border-4 border-blue-100 dark:border-slate-700 rounded-full"></div>
          <div className="absolute w-12 h-12 border-4 border-samsung-blue dark:border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-200 font-mono tracking-wide uppercase">
          Processing...
        </p>
      </div>
    </div>
  );
}
