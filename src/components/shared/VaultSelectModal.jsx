import React, { useState, useEffect } from 'react';
import { X, Cloud, File as FileIcon, CheckCircle } from 'lucide-react';
import { getVaultFiles } from '../../services/myFiles';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';

export default function VaultSelectModal({ onClose, onSelect, multiple = false }) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadFiles() {
      try {
        const data = await getVaultFiles(user.ghrId);
        setFiles(data);
      } catch (error) {
        console.error('Failed to load vault files', error);
      } finally {
        setLoading(false);
      }
    }
    loadFiles();
  }, [user.ghrId]);

  const toggleSelection = (id) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      if (!multiple) newSelection.clear();
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;
    setDownloading(true);
    
    try {
      window.dispatchEvent(new Event('api-request-start'));
      const selectedVaultFiles = files.filter(f => selectedIds.has(f.id));
      const fileObjects = await Promise.all(
        selectedVaultFiles.map(async (vf) => {
          const path = vf.filePath.startsWith('/') ? vf.filePath : `/${vf.filePath}`;
          const url = `http://localhost:5252${path}`;
          const response = await fetch(url);
          const blob = await response.blob();
          return new File([blob], vf.fileName, { type: blob.type });
        })
      );
      
      onSelect(fileObjects);
      window.dispatchEvent(new Event('api-request-end'));
      onClose();
    } catch (error) {
      window.dispatchEvent(new Event('api-request-end'));
      console.error('Failed to process selected vault files', error);
      alert('Failed to attach files from vault. Please try again.');
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-lg shadow-xl border border-border dark:border-slate-700 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-slate-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Cloud className="text-samsung-blue dark:text-blue-400" size={20} />
            Select from My Vault
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
            disabled={downloading}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-samsung-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <Cloud className="mx-auto text-gray-400 dark:text-slate-500 mb-3" size={48} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Your vault is empty</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Upload files in the My Vault section to use them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {files.map(file => {
                const isSelected = selectedIds.has(file.id);
                return (
                  <div 
                    key={file.id} 
                    onClick={() => toggleSelection(file.id)}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors relative ${
                      isSelected 
                        ? 'border-samsung-blue bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500' 
                        : 'border-border dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mr-3 ${
                      isSelected ? 'bg-samsung-blue text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                    }`}>
                      <FileIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={file.fileName}>{file.fileName}</p>
                      <p className="text-[10px] uppercase font-mono text-gray-500 dark:text-slate-400 mt-0.5">
                        {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-samsung-blue dark:text-blue-400">
                        <CheckCircle size={20} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border dark:border-slate-800 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            disabled={downloading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0 || downloading}
            className="px-4 py-2 text-sm font-medium text-white bg-samsung-blue hover:bg-blue-800 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Attaching...
              </>
            ) : (
              `Attach ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
