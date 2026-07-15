import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import httpClient from '../../services/httpClient';
import { Upload, CheckCircle, XCircle, Clock, File as FileIcon } from 'lucide-react';
import Toast from '../../components/shared/Toast';

export default function VehicleKYCSection({ vaultFiles, onUploadRequired }) {
  const { user } = useAuth();
  const [kycRecords, setKycRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [rcFileId, setRcFileId] = useState('');
  const [insuranceFileId, setInsuranceFileId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchKYC();
  }, [user.ghrId]);

  const fetchKYC = async () => {
    try {
      setLoading(true);
      const res = await httpClient.get(`/api/kyc/${user.ghrId}`);
      setKycRecords(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleNumber || !rcFileId || !insuranceFileId) {
      setToast({ visible: true, message: 'Please fill all fields', type: 'error' });
      return;
    }
    
    try {
      setSubmitting(true);
      await httpClient.post('/api/kyc', {
        vehicleNumber,
        rcFileId,
        insuranceFileId
      });
      setToast({ visible: true, message: 'Vehicle KYC submitted successfully!', type: 'success' });
      setVehicleNumber('');
      setRcFileId('');
      setInsuranceFileId('');
      fetchKYC();
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: 'Failed to submit KYC', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'approved') return <CheckCircle className="text-green-500" size={20} />;
    if (status === 'rejected') return <XCircle className="text-red-500" size={20} />;
    return <Clock className="text-amber-500" size={20} />;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-border dark:border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Vehicle KYC (Carpool)</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
        Register your vehicle for Carpool reimbursement. You must select your RC and Insurance documents from your Vault.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Number</label>
              <input
                type="text"
                placeholder="e.g. MH 12 AB 1234"
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue dark:border-slate-700"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                <span>RC Document</span>
                <button type="button" onClick={onUploadRequired} className="text-samsung-blue hover:underline text-xs">Upload new</button>
              </label>
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue dark:border-slate-700"
                value={rcFileId}
                onChange={(e) => setRcFileId(e.target.value)}
                required
              >
                <option value="">-- Select from Vault --</option>
                {vaultFiles.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
                <span>Insurance Document</span>
                <button type="button" onClick={onUploadRequired} className="text-samsung-blue hover:underline text-xs">Upload new</button>
              </label>
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue dark:border-slate-700"
                value={insuranceFileId}
                onChange={(e) => setInsuranceFileId(e.target.value)}
                required
              >
                <option value="">-- Select from Vault --</option>
                {vaultFiles.map(f => <option key={f.id} value={f.id}>{f.fileName}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-samsung-blue hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Vehicle for KYC'}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Your Registered Vehicles</h3>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-gray-100 dark:bg-slate-700 rounded-md"></div>
            </div>
          ) : kycRecords.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-slate-900 rounded-lg border border-dashed border-border dark:border-slate-700">
              <p className="text-sm text-gray-500 dark:text-slate-400">No vehicles registered yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kycRecords.map(kyc => (
                <div key={kyc.id} className="flex items-center justify-between p-3 border border-border dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{kyc.vehicleNumber}</p>
                    {kyc.status === 'approved' && kyc.lockedDistanceKm && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Locked Distance: {kyc.lockedDistanceKm} km</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      {getStatusIcon(kyc.status)} {kyc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
