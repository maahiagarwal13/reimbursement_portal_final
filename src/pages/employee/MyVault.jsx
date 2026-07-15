import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getVaultFiles, uploadVaultFile, deleteVaultFile } from '../../services/myFiles';
import { Cloud, Upload, File as FileIcon, X, Trash2, Eye } from 'lucide-react';
import Toast from '../../components/shared/Toast';
import FilePreviewModal from '../../components/shared/FilePreviewModal';
import { formatDate } from '../../utils/formatters';
import VehicleKYCSection from './VehicleKYCSection';

export default function MyVault() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [previewFile, setPreviewFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getVaultFiles(user.ghrId);
      setFiles(data);
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: 'Failed to load vault files.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user.ghrId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (uploadFile) => {
    if (!uploadFile) return;
    try {
      setUploading(true);
      // We can infer type from name, or just use 'other'
      let type = 'other';
      if (uploadFile.name.toLowerCase().includes('passport')) type = 'passport';
      else if (uploadFile.name.toLowerCase().includes('visa')) type = 'visa';
      else if (uploadFile.name.toLowerCase().includes('bill')) type = 'bill';

      await uploadVaultFile(user.ghrId, type, uploadFile);
      setToast({ visible: true, message: 'File uploaded successfully!', type: 'success' });
      fetchFiles();
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: 'Failed to upload file.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file from your vault?')) return;
    try {
      await deleteVaultFile(id);
      setToast({ visible: true, message: 'File deleted.', type: 'success' });
      fetchFiles();
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: 'Failed to delete file.', type: 'error' });
    }
  };

  return (
    <div className="p-6 w-full max-w-none mx-auto space-y-6">
      <div className="pb-4 border-b border-border dark:border-slate-700 bg-gradient-to-b from-blue-50/30 dark:from-slate-800/50 to-transparent -mx-6 px-6 pt-2 mb-2 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Cloud className="text-samsung-blue dark:text-blue-400" size={28} />
            My Files Vault
          </h1>
          <p className="text-sm font-mono tracking-wide uppercase text-gray-500 dark:text-slate-400 mt-1">
            Store and manage your commonly used documents
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-border dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upload New File</h2>
            <div
              className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-slate-900 cursor-pointer transition-colors ${
                isDragOver ? 'border-samsung-blue bg-blue-50 dark:bg-blue-900/30' : 'border-border dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('vault-upload').click()}
            >
              <input
                id="vault-upload"
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files.length > 0) handleFileUpload(e.target.files[0]);
                  e.target.value = '';
                }}
              />
              <Upload className={`mb-3 ${uploading ? 'text-samsung-blue animate-bounce' : 'text-gray-400 dark:text-slate-500'}`} size={32} />
              {uploading ? (
                <p className="text-sm font-medium text-samsung-blue dark:text-blue-400">Uploading...</p>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Click to upload or drag & drop</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">PDF, JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-border dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Your Files</h2>
            
            {loading ? (
              <div className="animate-pulse flex flex-col gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-border dark:border-slate-700">
                <Cloud className="mx-auto text-gray-400 dark:text-slate-500 mb-3" size={48} />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Your vault is empty</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Upload your commonly used documents to access them quickly when submitting requests.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 content-start">
                {files.map(file => (
                  <div key={file.id} className="flex items-start p-4 bg-white dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg shadow-sm hover:border-samsung-blue dark:hover:border-blue-500 transition-colors group">
                    <div className="w-10 h-10 rounded bg-blue-50 dark:bg-blue-900/30 text-samsung-blue dark:text-blue-400 flex items-center justify-center shrink-0 mr-3">
                      <FileIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={file.fileName}>{file.fileName}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Uploaded {formatDate(file.uploadedAt)}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button 
                        onClick={() => setPreviewFile({ url: file.filePath, name: file.fileName })}
                        className="p-1.5 text-gray-400 hover:text-samsung-blue dark:hover:text-blue-400 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        title="Preview"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <VehicleKYCSection vaultFiles={files} onUploadRequired={() => document.getElementById('vault-upload').click()} />
      </div>

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
