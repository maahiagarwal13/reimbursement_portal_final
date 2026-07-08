import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Wifi, Info, HelpCircle } from 'lucide-react';
import UploadZone from '../../components/shared/UploadZone';
import Toast from '../../components/shared/Toast';
import { createInternetRequest, saveDraftRequest, getRequestById } from '../../services/requests';
import { getRateConfig } from '../../services/rateConfig';
import { useAuth } from '../../context/AuthContext';

export default function Internet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  
  const [cap, setCap] = useState(1000); // Default, will load from config
  
  useEffect(() => {
    const loadCap = async () => {
      try {
        const config = await getRateConfig('internetCap');
        if (config && config.rates && config.rates[user.cl]) {
          setCap(config.rates[user.cl].value);
        }
      } catch (err) {
        console.error("Failed to load internet cap:", err);
      }
    };
    loadCap();
  }, [user.cl]);
  
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [duration, setDuration] = useState(1);
  const [periods, setPeriods] = useState([{ label: 'Month 1', amount: '', file: null }]);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadDraft() {
      if (draftId) {
        try {
          const draft = await getRequestById(draftId);
          if (draft && draft.stage === 'draft' && draft.draftData) {
            setStep(draft.draftData.step || 1);
            setProvider(draft.draftData.provider || '');
            setFrequency(draft.draftData.frequency || 'monthly');
            setDuration(draft.draftData.duration || 1);
            if (draft.draftData.periods) {
              setPeriods(draft.draftData.periods);
            }
          }
        } catch (err) {
          console.error("Failed to load draft", err);
        }
      }
    }
    loadDraft();
  }, [draftId]);

  // Update rows when frequency or duration changes
  useMemo(() => {
    let max = 1;
    let prefix = 'Month';
    if (frequency === 'monthly') { max = Math.min(12, Math.max(1, duration)); prefix = 'Month'; }
    else if (frequency === 'quarterly') { max = Math.min(4, Math.max(1, duration)); prefix = 'Q'; }
    else if (frequency === 'half-yearly') { max = Math.min(2, Math.max(1, duration)); prefix = 'Half-Year'; }
    else if (frequency === 'yearly') { max = 1; prefix = 'Year'; }
    
    setPeriods(prev => {
      const newP = [];
      for (let i = 0; i < max; i++) {
        const existing = prev[i] || { amount: '', file: null };
        newP.push({
          label: frequency === 'yearly' ? 'Yearly Bill' : `${prefix} ${i + 1}`,
          amount: existing.amount,
          file: existing.file
        });
      }
      return newP;
    });
  }, [frequency, duration]);

  const totalAmount = periods.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const monthsPerPeriod = frequency === 'yearly' ? 12 : frequency === 'half-yearly' ? 6 : frequency === 'quarterly' ? 3 : 1;
  const maxAllowed = cap * monthsPerPeriod * periods.length;
  const claimable = Math.min(totalAmount, maxAllowed);

  const handlePeriodChange = (i, field, val) => {
    const newP = [...periods];
    newP[i][field] = val;
    setPeriods(newP);
  };

  const formatINR = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const handleNext = (e) => {
    e.preventDefault();
    if (!provider || periods.some(p => !p.amount || !p.file)) {
      setError(true);
    } else {
      setError(false);
      setStep(2);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraftRequest({
        draftId,
        ghrId: user.ghrId,
        type: 'internet-bill',
        draftData: { step, provider, frequency, duration, periods }
      });
      setToast({ visible: true, message: 'Saved as draft', type: 'success' });
      navigate('/requests');
    } catch (err) {
      setToast({ visible: true, message: 'Failed to save draft: ' + err.message, type: 'error' });
    }
  };

  const handleSubmit = async () => {
    if (!provider || periods.some(p => !p.amount || !p.file)) { setError(true); return; }
    setLoading(true);
    try {
      await createInternetRequest({
        ghrId: user.ghrId,
        draftId,
        provider,
        frequency,
        totalAmount,
        claimableAmount: claimable,
        periods: periods.map(p => ({
          periodLabel: p.label,
          amount: parseFloat(p.amount) || 0,
          hasBillDocument: !!p.file,
          billDocument: p.file?.name || null
        }))
      });
      setToast({ visible: true, message: 'Internet request submitted successfully', type: 'success' });
      setTimeout(() => navigate('/requests'), 1500);
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: 'Failed to submit request', type: 'error' });
      setError(true);
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
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Internet Bill Reimbursement</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">Step {step} of 2: {step === 1 ? 'Submit your internet bills' : 'Review Submission'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-lg shadow-sm border-t-4 border-samsung-blue border-l border-r border-b border-border">
          <div className="px-6 md:px-8 py-5 border-b border-border flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-semibold text-gray-900 m-0">Request Details</h2>
            <span className="text-xs font-mono uppercase tracking-wide text-gray-400">Draft auto-saved</span>
          </div>

          <div className="p-6 md:p-8 max-w-4xl">
            {step === 1 && (
              <form onSubmit={handleNext}>
                <div className="bg-blue-50 text-samsung-blue px-4 py-3 rounded-md text-sm mb-6 flex items-start gap-3 border border-blue-100">
                  <span className="font-semibold mt-0.5">ⓘ</span>
                  <div>
                    Your internet reimbursement cap ({user.cl}): <strong>{formatINR(cap)} per month</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Internet Provider <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue focus:border-samsung-blue text-sm"
                      placeholder="e.g. Airtel Broadband" 
                      value={provider} 
                      onChange={e => setProvider(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Billing Frequency <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue focus:border-samsung-blue text-sm bg-white"
                      value={frequency} 
                      onChange={e => setFrequency(e.target.value)}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="half-yearly">Half Yearly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {frequency !== 'yearly' && (
                  <div className="flex flex-col gap-1.5 mb-6 max-w-xs">
                    <label className="text-sm font-medium text-gray-700">Number of Periods <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue focus:border-samsung-blue text-sm bg-white"
                      value={duration} 
                      onChange={e => setDuration(parseInt(e.target.value))}
                    >
                      {Array.from({ length: frequency === 'monthly' ? 12 : frequency === 'quarterly' ? 4 : 2 }).map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1} {frequency === 'monthly' ? 'Months' : frequency === 'quarterly' ? 'Quarters' : 'Half-Years'}</option>
                      ))}
                    </select>
                  </div>
                )}

                <h3 className="text-sm font-semibold mb-4 text-gray-900 border-b border-border pb-2">Bill Breakdown</h3>
                <div className="flex flex-col gap-4 mb-6">
                  {periods.map((p, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-md border border-border">
                      <div className="font-medium text-sm text-samsung-blue mb-3">{p.label}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-gray-700">Bill Amount (₹) <span className="text-red-500">*</span></label>
                          <input 
                            type="number" 
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue focus:border-samsung-blue text-sm"
                            placeholder="0" 
                            value={p.amount} 
                            onChange={e => handlePeriodChange(i, 'amount', e.target.value)} 
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-gray-700">Upload Bill <span className="text-red-500">*</span></label>
                          <UploadZone id={`bill-${i}`} accept=".pdf,.png,.jpg" onFile={f => handlePeriodChange(i, 'file', f)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 text-sm">Total Billed Amount</span>
                    <strong className="text-base text-gray-900">{formatINR(totalAmount)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Eligible Claim Amount (Cap: {formatINR(maxAllowed)})</span>
                    <strong className="text-lg text-samsung-blue font-semibold">{formatINR(claimable)}</strong>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200">
                    Please fill all required fields and upload all bill documents.
                  </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                  <button type="button" onClick={() => navigate('/new-request')} className="text-gray-600 hover:text-gray-900 font-medium text-sm">Cancel</button>
                  <div className="flex gap-3">
                    <button type="button" onClick={handleSaveDraft} className="px-6 py-2.5 rounded-md font-medium text-sm border border-border text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
                      Save as Draft
                    </button>
                    <button type="submit" className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue">
                      Review & Next
                    </button>
                  </div>
                </div>
              </form>
            )}

            {step === 2 && (
              <div>
                <div className="bg-gray-50 p-6 rounded-md border border-border mb-6">
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-gray-500">Provider:</div>
                    <div className="font-medium text-gray-900">{provider}</div>
                    <div className="text-gray-500">Frequency:</div>
                    <div className="font-medium text-gray-900 capitalize">{frequency} ({periods.length} periods)</div>
                    <div className="text-gray-500">Total Billed:</div>
                    <div className="font-medium text-gray-900">{formatINR(totalAmount)}</div>
                    <div className="text-gray-500">Eligible Claim:</div>
                    <div className="font-medium text-samsung-blue">{formatINR(claimable)}</div>
                  </div>
                </div>

                <h3 className="text-sm font-semibold mb-3 text-gray-900">Breakdown</h3>
                <div className="flex flex-col gap-2 mb-8">
                  {periods.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{p.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{p.file?.name}</div>
                      </div>
                      <div className="font-medium text-sm text-gray-900">{formatINR(p.amount)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
                  <button onClick={() => setStep(1)} className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                    ← Back to Edit
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={handleSaveDraft} className="btn btn--secondary btn--md">
                      Save as Draft
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed">
                      {loading ? 'Submitting...' : 'Confirm & Submit'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contextual Info */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 sticky top-6">
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900">
              <Info size={18} className="text-samsung-blue" /> Policy Highlights
            </h3>
            
            <ul className="pl-5 list-disc text-gray-600 text-sm flex flex-col gap-3 mb-6 marker:text-samsung-blue">
              <li>Reimbursement is limited to your monthly cap of <strong className="text-gray-900">{formatINR(cap)}</strong>.</li>
              <li>Only broadband or mobile data plans used explicitly for remote work are eligible.</li>
              <li>You must attach a valid tax invoice (bill) for every period you are claiming.</li>
            </ul>

            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-gray-900 border-t border-gray-100 pt-4">
              <HelpCircle size={16} className="text-gray-400" /> FAQ
            </h3>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-800 mb-0.5">Can I claim a prepaid plan?</p>
              <p className="text-xs text-gray-600 mb-2">Yes, provided you have a valid receipt/invoice from the provider.</p>
              
              <p className="text-sm font-medium text-gray-800 mb-0.5">What if my bill exceeds the cap?</p>
              <p className="text-xs text-gray-600">You will only be reimbursed up to your limit. The portal automatically calculates the eligible amount.</p>
            </div>
          </div>
        </div>

      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
