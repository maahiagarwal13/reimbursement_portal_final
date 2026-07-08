import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Truck, Info, HelpCircle } from 'lucide-react';
import FormField from '../../components/shared/FormField';
import UploadZone from '../../components/shared/UploadZone';
import Select from '../../components/shared/Select';
import Toast from '../../components/shared/Toast';
import { createRelocationRequest, saveDraftRequest, getRequestById } from '../../services/requests';
import { getRateConfig } from '../../services/rateConfig';
import { useAuth } from '../../context/AuthContext';

export default function Relocation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [relocationBase, setRelocationBase] = useState(null);

  const [relocationItems, setRelocationItems] = useState([{ component: 'Accommodation', claimedAmount: '' }]);

  useEffect(() => {
    async function loadRates() {
      try {
        const config = await getRateConfig('relocation');
        if (config) {
          setRelocationBase(config.baseAllowance);
        }
      } catch (err) {
        console.error("Failed to load relocation cap", err);
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
            if (draft.draftData.relocationItems) {
              setRelocationItems(draft.draftData.relocationItems);
            }
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
        type: 'relocation',
        draftData: { relocationItems }
      });
      setToast({ visible: true, message: 'Saved as draft', type: 'success' });
      navigate('/requests');
    } catch (err) {
      setToast({ visible: true, message: 'Failed to save draft: ' + err.message, type: 'error' });
    }
  };

  const handleRelocationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createRelocationRequest({
        ghrId: user.ghrId,
        draftId,
        relocationLineItems: relocationItems.map(item => ({
          component: item.component,
          claimedAmount: Number(item.claimedAmount)
        }))
      });
      setToast({ visible: true, message: 'Relocation request submitted successfully', type: 'success' });
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
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Relocation Reimbursement</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">Submit your relocation expenses for reimbursement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-lg shadow-sm border-t-4 border-samsung-blue border-l border-r border-b border-border">
          <div className="px-6 md:px-8 py-5 border-b border-border flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-semibold text-gray-900 m-0">Relocation Details</h2>
            <span className="text-xs font-mono uppercase tracking-wide text-gray-400">Draft auto-saved</span>
          </div>

          <form onSubmit={handleRelocationSubmit} className="p-6 md:p-8 max-w-4xl">
            <div className="flex flex-col gap-6 mb-8 max-w-2xl">
              {relocationItems.map((item, idx) => (
                <div key={idx} className="flex items-end gap-4">
                  <div className="flex-1">
                    <Select id={`component-${idx}`} label="Component" options={[
                      {label: 'Accommodation', value: 'Accommodation'},
                      {label: 'Brokerage', value: 'Brokerage'},
                      {label: 'Shipment', value: 'Shipment'},
                      {label: 'Travel', value: 'Travel'}
                    ]} value={item.component} onChange={e => {
                      const newItems = [...relocationItems];
                      newItems[idx].component = e.target.value;
                      setRelocationItems(newItems);
                    }} />
                  </div>
                  <div className="flex-1">
                    <FormField id={`amount-${idx}`} label="Claimed Amount (₹)" type="number" value={item.claimedAmount} onChange={e => {
                      const newItems = [...relocationItems];
                      newItems[idx].claimedAmount = e.target.value;
                      setRelocationItems(newItems);
                    }} required />
                  </div>
                  {idx > 0 && (
                    <button type="button" onClick={() => setRelocationItems(relocationItems.filter((_, i) => i !== idx))} className="px-3 py-2 border border-red-200 text-status-rejected bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium mb-1">
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setRelocationItems([...relocationItems, { component: 'Accommodation', claimedAmount: '' }])} className="w-max px-4 py-2 border border-border text-gray-700 bg-white hover:bg-gray-50 rounded-md text-sm font-medium flex items-center gap-1">
                + Add Component
              </button>
              
              <div className="mt-4">
                <UploadZone id="relocationProofs" label="Upload Proofs (Receipts, Invoices)" accept=".pdf,.png,.jpg" multiple required />
              </div>
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
              <li>Your eligible base relocation allowance is <strong className="text-gray-900">₹{relocationBase?.toLocaleString('en-IN') || '50,000'}</strong>.</li>
              <li>Reimbursement applies only to actual expenses supported by original GST invoices.</li>
              <li>Accommodation claims are capped at 15 days of temporary stay.</li>
            </ul>

            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-gray-900 border-t border-gray-100 pt-4">
              <HelpCircle size={16} className="text-gray-400" /> FAQ
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800 mb-0.5">What proofs are required?</p>
                <p className="text-xs text-gray-600">GST invoices for movers/packers, hotel receipts, and stamped brokerage agreements.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 mb-0.5">Can I submit partially?</p>
                <p className="text-xs text-gray-600">No, please submit all relocation expenses in a single comprehensive claim.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
