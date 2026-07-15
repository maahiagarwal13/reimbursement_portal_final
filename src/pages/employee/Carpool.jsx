import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
import Toast from '../../components/shared/Toast';
import httpClient from '../../services/httpClient';
import { useAuth } from '../../context/AuthContext';
import { uploadVaultFile } from '../../services/myFiles';
import UploadZone from '../../components/shared/UploadZone';

export default function Carpool() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  
  const [type, setType] = useState('carpool');
  const [excelFiles, setExcelFiles] = useState([]);
  const [mapFiles, setMapFiles] = useState([]);
  const [fuelFiles, setFuelFiles] = useState([]);
  const [fuelRate, setFuelRate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!excelFiles[0] || !mapFiles[0] || !fuelFiles[0] || !fuelRate || !totalAmount) {
      setToast({ visible: true, message: 'Please fill all required fields and upload all documents.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // 1. Upload files to vault to get their IDs
      const excelRes = await uploadVaultFile(user.ghrId, 'carpool_excel', excelFiles[0]);
      const mapRes = await uploadVaultFile(user.ghrId, 'carpool_map', mapFiles[0]);
      const fuelRes = await uploadVaultFile(user.ghrId, 'carpool_fuel', fuelFiles[0]);

      // 2. Submit the reimbursement request
      await httpClient.post('/api/requests/carpool-reimbursement/submit', {
        reimbursementType: type,
        excelFileId: excelRes.id,
        mapScreenshotId: mapRes.id,
        fuelProofId: fuelRes.id,
        userFuelRate: parseFloat(fuelRate),
        totalAmount: parseFloat(totalAmount)
      });
      
      setToast({ visible: true, message: 'Carpool reimbursement submitted successfully', type: 'success' });
      setTimeout(() => navigate('/requests'), 1500);
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: err.message || 'Failed to submit reimbursement', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-none mx-auto flex flex-col gap-6">
      <button 
        onClick={() => navigate('/new-request')}
        className="text-samsung-blue text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer w-max focus:outline-none"
      >
        ← Back to request types
      </button>
      
      <div className="pb-4 border-b border-border dark:border-slate-700 bg-gradient-to-b from-blue-50/30 dark:from-slate-800/50 to-transparent -mx-6 px-6 pt-2 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100">Carpool / Cabpool Reimbursement</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 dark:text-slate-400 mt-1">Submit your monthly carpool or cabpool claims</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="flex-1 min-w-0 xl:col-span-9 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-t-4 border-samsung-blue dark:border-t-blue-500 border-l border-r border-b border-border dark:border-slate-700">
          <div className="px-6 md:px-8 py-5 border-b border-border dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-700/50">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 m-0">Reimbursement Details</h2>
          </div>

          <div className="p-6 md:p-8 max-w-4xl">
            <form onSubmit={handleSubmit}>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Type <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue focus:border-samsung-blue text-sm bg-white dark:bg-slate-700 dark:text-gray-100"
                    value={type} 
                    onChange={e => setType(e.target.value)}
                    required
                  >
                    <option value="carpool">Carpooling</option>
                    <option value="cabpool">Cabpooling</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Total Claim Amount (₹) <span className="text-red-500">*</span></label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue focus:border-samsung-blue text-sm bg-white dark:bg-slate-700 dark:text-gray-100"
                    placeholder="Enter total amount"
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Fuel Price for the Month (₹/L) <span className="text-red-500">*</span></label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue focus:border-samsung-blue text-sm bg-white dark:bg-slate-700 dark:text-gray-100"
                    placeholder="Enter fuel rate"
                    value={fuelRate}
                    onChange={e => setFuelRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Upload Carpool/Cabpool Excel Sheet <span className="text-red-500">*</span></h3>
                  <UploadZone 
                    id="excelUpload" 
                    files={excelFiles} 
                    onFilesChange={setExcelFiles} 
                    accept=".xlsx,.xls,.csv" 
                    label="Drag & drop your Excel sheet here or click to browse" 
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Google Map Screenshot (Distance Proof) <span className="text-red-500">*</span></h3>
                  <UploadZone 
                    id="mapUpload" 
                    files={mapFiles} 
                    onFilesChange={setMapFiles} 
                    accept=".png,.jpg,.jpeg,.pdf" 
                    label="Drag & drop screenshot here or click to browse" 
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Fuel Price Screenshot (Proof) <span className="text-red-500">*</span></h3>
                  <UploadZone 
                    id="fuelUpload" 
                    files={fuelFiles} 
                    onFilesChange={setFuelFiles} 
                    accept=".png,.jpg,.jpeg,.pdf" 
                    label="Drag & drop fuel price proof here or click to browse" 
                  />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border dark:border-slate-700 flex justify-between items-center">
                <button type="button" onClick={() => navigate('/new-request')} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-sm">Cancel</button>
                <div className="flex gap-3">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Reimbursement'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Contextual Info */}
        <div className="w-full lg:w-[360px] shrink-0 xl:col-span-3 flex flex-col gap-6 sticky top-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-border dark:border-slate-700 shadow-sm">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-gray-100">
              <Info size={18} className="text-samsung-blue dark:text-blue-400" /> Upload Instructions
            </h3>
            
            <ul className="pl-5 list-disc text-gray-600 dark:text-slate-400 text-sm flex flex-col gap-3 mb-6 marker:text-samsung-blue dark:marker:text-blue-400">
              <li>Upload the standard Excel sheet containing all your carpool/cabpool logs.</li>
              <li>Provide a Google Map screenshot demonstrating the distance.</li>
              <li>Provide a screenshot of the fuel price for the current month as proof.</li>
              <li>Enter your calculated claim amount and fuel price manually in the form.</li>
            </ul>
          </div>
        </div>

      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
