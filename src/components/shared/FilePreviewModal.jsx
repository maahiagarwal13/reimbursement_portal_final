import React, { useEffect, useState } from 'react';
import { X, FileText, Download } from 'lucide-react';

export default function FilePreviewModal({ file, onClose }) {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (file) {
      let url;
      if (file instanceof File || file instanceof Blob) {
        url = URL.createObjectURL(file);
      } else if (file.url) {
        url = file.url.startsWith('/') ? `http://localhost:5252${file.url}` : file.url;
      } else if (file.name) {
        // Fallback for files coming from backend
        url = `http://localhost:5252/user-files/${encodeURIComponent(file.name)}`;
      }

      setObjectUrl(url);
      
      // Handle escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);
      
      return () => {
        if (file instanceof File || file instanceof Blob) {
          URL.revokeObjectURL(url);
        }
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [file, onClose]);

  if (!file || !objectUrl) return null;

  const isImage = file.type?.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif)$/i);
  const isPdf = file.type === 'application/pdf' || file.name.match(/\.pdf$/i);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileText size={18} className="text-gray-500 flex-shrink-0" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={file.name}>
              {file.name}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a 
              href={objectUrl} 
              download={file.name}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-500 hover:text-samsung-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Download file"
            >
              <Download size={18} />
            </a>
            <button 
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-auto flex items-center justify-center p-4">
          {isImage && (
            <img 
              src={objectUrl} 
              alt={file.name} 
              className="max-w-full max-h-[calc(90vh-100px)] object-contain shadow-sm bg-white dark:bg-gray-800"
            />
          )}
          
          {isPdf && (
            <iframe
              src={objectUrl}
              title={file.name}
              className="w-full h-[calc(90vh-80px)] bg-white shadow-sm border-0"
            />
          )}

          {!isImage && !isPdf && (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400 gap-3">
              <FileText size={48} className="text-gray-400 dark:text-gray-600" />
              <p>Preview not available for this file type.</p>
              <a 
                href={objectUrl} 
                download={file.name}
                target="_blank"
                rel="noopener noreferrer"
                className="text-samsung-blue dark:text-blue-400 hover:underline text-sm font-medium mt-2"
              >
                Download to view
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
