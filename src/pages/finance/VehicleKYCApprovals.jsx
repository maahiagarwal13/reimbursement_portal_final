import React, { useState, useEffect } from 'react';
import httpClient from '../../services/httpClient';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/shared/Badge';
import { formatDate } from '../../utils/formatters';
import Toast from '../../components/shared/Toast';

export default function VehicleKYCApprovals() {
  const [kycs, setKycs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [lockedDistance, setLockedDistance] = useState('');

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await httpClient.get('/api/kyc/pending');
      setKycs(res);
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: 'Failed to load pending KYC', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!lockedDistance) {
      setToast({ visible: true, message: 'Please enter locked distance', type: 'error' });
      return;
    }
    try {
      await httpClient.post(`/api/kyc/${selectedKyc.id}/approve`, { lockedDistanceKm: parseFloat(lockedDistance) });
      setToast({ visible: true, message: 'KYC approved', type: 'success' });
      setSelectedKyc(null);
      loadPending();
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: 'Failed to approve', type: 'error' });
    }
  };

  const handleReject = async () => {
    try {
      await httpClient.post(`/api/kyc/${selectedKyc.id}/reject`);
      setToast({ visible: true, message: 'KYC rejected', type: 'success' });
      setSelectedKyc(null);
      loadPending();
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: 'Failed to reject', type: 'error' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID', isNumeric: true },
    { key: 'empId', label: 'Employee ID' },
    { key: 'vehicleNumber', label: 'Vehicle Number' },
    { key: 'createdAt', label: 'Submitted Date', isNumeric: true, render: (val) => formatDate(val) },
    { key: 'status', label: 'Status', render: (val) => <Badge status={val}>{val}</Badge> }
  ];

  return (
    <div className="p-6 w-full max-w-none mx-auto flex flex-col gap-8">
      <div className="pb-6 border-b border-border bg-gradient-to-b from-blue-50/30 dark:from-blue-900/20 to-transparent -mx-6 px-6 pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white">Vehicle KYC Approvals</h1>
          <p className="text-sm font-mono tracking-wide uppercase text-gray-500 dark:text-gray-400 mt-1">Review and approve carpool vehicle KYC</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-md border border-border overflow-hidden shadow-sm">
        <DataTable 
          columns={columns} 
          data={kycs} 
          emptyMessage="No pending KYC requests."
          onRowClick={(row) => { setSelectedKyc(row); setLockedDistance(''); }}
        />
      </div>

      {selectedKyc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Vehicle KYC</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Employee ID</p>
                <p className="font-medium">{selectedKyc.empId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Vehicle Number</p>
                <p className="font-medium">{selectedKyc.vehicleNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Documents</p>
                <div className="flex gap-4 mt-1">
                  <a href={`/api/myfiles/download/${selectedKyc.insuranceFileId}`} target="_blank" rel="noreferrer" className="text-samsung-blue hover:underline text-sm">View Insurance</a>
                  <a href={`/api/myfiles/download/${selectedKyc.rcFileId}`} target="_blank" rel="noreferrer" className="text-samsung-blue hover:underline text-sm">View RC</a>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Locked Map Distance (km)</label>
                <input
                  type="number"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue dark:border-slate-700"
                  value={lockedDistance}
                  onChange={(e) => setLockedDistance(e.target.value)}
                  placeholder="e.g. 15.5"
                />
                <p className="text-xs text-gray-500 mt-1">Calculate standard distance on Maps from Home to Office and lock it here.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border dark:border-slate-700">
              <button 
                onClick={() => setSelectedKyc(null)}
                className="px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
              >
                Reject
              </button>
              <button 
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium"
              >
                Approve & Lock Distance
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
