import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Car, Info, HelpCircle } from 'lucide-react';
import FormField from '../../components/shared/FormField';
import UploadZone from '../../components/shared/UploadZone';
import Select from '../../components/shared/Select';
import Toast from '../../components/shared/Toast';
import { createCarpoolRequest, saveDraftRequest, getRequestById } from '../../services/requests';
import { getRateConfig } from '../../services/rateConfig';
import { useAuth } from '../../context/AuthContext';

export default function Carpool() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [carpoolCap, setCarpoolCap] = useState(null);

  const [carpoolData, setCarpoolData] = useState({ vehicleType: 'own', claimType: 'both_way', distance: '', amount: '', confirmation: false });

  useEffect(() => {
    async function loadRates() {
      try {
        const config = await getRateConfig('carpool');
        if (config) {
          setCarpoolCap(config.dailyCap);
        }
      } catch (err) {
        console.error("Failed to load carpool cap", err);
      }
    }
    loadRates();
  }, []);

  useEffect(() => {
    async function loadDraft() {
      if (draftId) {
        try {
          const draft = await getRequestById(draftId);
          if (draft && draft.stage === 'draft' && draft.draftData) {
            setCarpoolData(draft.draftData);
          }
        } catch (err) {
          console.error("Failed to load draft", err);
        }
      }
    }
    loadDraft();
  }, [draftId]);

  const handleSaveDraft = async () => {
    try {
      await saveDraftRequest({
        draftId,
        ghrId: user.ghrId,
        type: 'carpool',
        draftData: carpoolData
      });
      setToast({ visible: true, message: 'Saved as draft', type: 'success' });
      navigate('/requests');
    } catch (err) {
      setToast({ visible: true, message: 'Failed to save draft: ' + err.message, type: 'error' });
    }
  };

  const handleCarpoolSubmit = async (e) => {
    e.preventDefault();
    if (carpoolData.vehicleType === 'own' && !carpoolData.confirmation) {
      setToast({ visible: true, message: 'You must confirm insurance and 4-wheeler criteria', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await createCarpoolRequest({
        ghrId: user.ghrId,
        draftId,
        vehicleType: carpoolData.vehicleType,
        claimType: carpoolData.claimType,
        distance: Number(carpoolData.distance),
        amount: Number(carpoolData.amount)
      });
      setToast({ visible: true, message: 'Carpool request submitted successfully', type: 'success' });
      setTimeout(() => navigate('/requests'), 1500);
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
      <button 
        onClick={() => navigate('/new-request')}
        className="text-samsung-blue text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer w-max focus:outline-none"
      >
        ← Back to request types
      </button>
      
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Carpool Reimbursement</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">Submit your carpool claim for commuting to the office</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-lg shadow-sm border-t-4 border-samsung-blue border-l border-r border-b border-border">
          <div className="px-6 md:px-8 py-5 border-b border-border flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-semibold text-gray-900 m-0">Carpool Details</h2>
            <span className="text-xs font-mono uppercase tracking-wide text-gray-400">Draft auto-saved</span>
          </div>

          <form onSubmit={handleCarpoolSubmit} className="p-6 md:p-8 max-w-4xl">
            <div className="flex flex-col gap-6 mb-8 max-w-lg">
              <Select id="vehicleType" label="Vehicle Type" options={[{label: 'Own Vehicle', value: 'own'}, {label: 'Rented / Cab', value: 'rented'}]} value={carpoolData.vehicleType} onChange={e => setCarpoolData({...carpoolData, vehicleType: e.target.value})} />
              <Select id="claimType" label="Claim Route" options={[{label: 'One Way', value: 'one_way'}, {label: 'Both Ways', value: 'both_way'}]} value={carpoolData.claimType} onChange={e => setCarpoolData({...carpoolData, claimType: e.target.value})} />
              
              {carpoolData.vehicleType === 'own' ? (
                <>
                  <FormField id="distance" label="Distance (km, home to office)" type="number" value={carpoolData.distance} onChange={e => setCarpoolData({...carpoolData, distance: e.target.value})} required />
                  <div className="flex items-start gap-3 bg-gray-50 p-4 border border-border rounded-md mt-2">
                    <input type="checkbox" id="carpoolConfirm" className="rounded border-gray-300 text-samsung-blue focus:ring-samsung-blue mt-0.5" checked={carpoolData.confirmation} onChange={e => setCarpoolData({...carpoolData, confirmation: e.target.checked})} />
                    <label htmlFor="carpoolConfirm" className="text-sm font-medium text-gray-700 leading-snug cursor-pointer">I confirm that I have valid vehicle insurance, am driving a 4-wheeler, and have picked up my assigned colleagues.</label>
                  </div>
                </>
              ) : (
                <>
                  <FormField id="amount" label="Bill Amount (₹)" type="number" value={carpoolData.amount} onChange={e => setCarpoolData({...carpoolData, amount: e.target.value})} required />
                  <div className="mt-2">
                    <UploadZone id="cabBill" label="Upload Cab Bill" accept=".pdf,.png,.jpg" required />
                  </div>
                </>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
              <button type="button" onClick={() => navigate('/new-request')} className="text-gray-600 hover:text-gray-900 font-medium text-sm">Cancel</button>
              <div className="flex gap-3">
                <button type="button" onClick={handleSaveDraft} className="px-6 py-2.5 rounded-md font-medium text-sm border border-border text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
                  Save as Draft
                </button>
                <button type="submit" disabled={loading} className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Contextual Info */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 sticky top-6">
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900">
              <Info size={18} className="text-samsung-blue" /> Policy Highlights
            </h3>
            
            <ul className="pl-5 list-disc text-gray-600 text-sm flex flex-col gap-3 mb-6 marker:text-samsung-blue">
              <li>Carpool reimbursement is capped at <strong className="text-gray-900">₹{carpoolCap || 1000} / day</strong>.</li>
              <li>You must use a 4-wheeler to claim the "Own Vehicle" carpool benefit. 2-wheelers are not eligible.</li>
              <li>Only actual commuting days are eligible for reimbursement.</li>
            </ul>

            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-gray-900 border-t border-gray-100 pt-4">
              <HelpCircle size={16} className="text-gray-400" /> FAQ
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800 mb-0.5">Can I claim Uber/Ola?</p>
                <p className="text-xs text-gray-600">Yes, under the "Rented / Cab" category. Ensure you upload the invoice.</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-800 mb-0.5">How is the own-vehicle rate calculated?</p>
                <p className="text-xs text-gray-600">It is based on a fixed per-km rate determined by policy, subject to the daily cap.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
