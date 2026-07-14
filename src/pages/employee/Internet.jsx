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
      // Check local storage first
      const localDraftJson = localStorage.getItem(`draft_internet_${draftId || 'new'}`);
      if (localDraftJson) {
        try {
          const draft = JSON.parse(localDraftJson);
          if (draft.draftData) {
            setStep(draft.draftData.step || 1);
            setProvider(draft.draftData.provider || '');
            setFrequency(draft.draftData.frequency || 'monthly');
            setDuration(draft.draftData.duration || 1);
            if (draft.draftData.periods) {
              setPeriods(draft.draftData.periods);
            }
          }
          return;
        } catch (err) {
          console.error("Failed to parse local draft", err);
        }
      }

      if (draftId && draftId !== 'new') {
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
      const draft = { draftData: { step, provider, frequency, duration, periods } };
      localStorage.setItem(`draft_internet_${draftId || 'new'}`, JSON.stringify(draft));
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
      localStorage.removeItem(`draft_internet_${draftId || 'new'}`);
      setTimeout(() => navigate('/requests'), 1500);
    } catch (err) {
      console.error(err);
      setToast({ visible: true, message: 'Failed to submit request', type: 'error' });
      setError(true);
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
        <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100">Internet Bill Reimbursement</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 dark:text-slate-400 mt-1">Step {step} of 2: {step === 1 ? 'Submit your internet bills' : 'Review Submission'}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="flex-1 min-w-0 xl:col-span-9 bg-white dark:bg-slate-800 rounded-lg shadow-sm border-t-4 border-samsung-blue dark:border-t-blue-500 border-l border-r border-b border-border dark:border-slate-700">
          <div className="px-6 md:px-8 py-5 border-b border-border dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-700/50">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 m-0">Request Details</h2>
            <span className="text-xs font-mono uppercase tracking-wide text-gray-400 dark:text-slate-400">Draft auto-saved</span>
          </div>

          <div className="p-6 md:p-8 max-w-4xl">
            {step === 1 && (
              <form onSubmit={handleNext}>
                <div className="bg-blue-50 dark:bg-blue-900/30 text-samsung-blue dark:text-blue-400 px-4 py-3 rounded-md text-sm mb-6 flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                  <span className="font-semibold mt-0.5">ⓘ</span>
                  <div>
                    Your internet reimbursement cap ({user.cl}): <strong>{formatINR(cap)} per month</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Internet Provider <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue focus:border-samsung-blue text-sm dark:bg-slate-700 dark:text-gray-100"
                      placeholder="e.g. Airtel Broadband" 
                      value={provider} 
                      onChange={e => setProvider(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Billing Frequency <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue focus:border-samsung-blue text-sm bg-white dark:bg-slate-700 dark:text-gray-100"
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
                    <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Number of Periods <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue focus:border-samsung-blue text-sm bg-white dark:bg-slate-700 dark:text-gray-100"
                      value={duration} 
                      onChange={e => setDuration(parseInt(e.target.value))}
                    >
                      {Array.from({ length: frequency === 'monthly' ? 12 : frequency === 'quarterly' ? 4 : 2 }).map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1} {frequency === 'monthly' ? 'Months' : frequency === 'quarterly' ? 'Quarters' : 'Half-Years'}</option>
                      ))}
                    </select>
                  </div>
                )}

                <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-gray-100 border-b border-border dark:border-slate-700 pb-2">Bill Breakdown</h3>
                <div className="flex flex-col gap-4 mb-6">
                  {periods.map((p, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-md border border-border dark:border-slate-600">
                      <div className="font-medium text-sm text-samsung-blue dark:text-blue-400 mb-3">{p.label}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Bill Amount (₹) <span className="text-red-500">*</span></label>
                          <input 
                            type="number" 
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-samsung-blue focus:border-samsung-blue text-sm dark:bg-slate-700 dark:text-gray-100"
                            placeholder="0" 
                            value={p.amount} 
                            onChange={e => handlePeriodChange(i, 'amount', e.target.value)} 
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Upload Bill <span className="text-red-500">*</span></label>
                          <UploadZone id={`bill-${i}`} accept=".pdf,.png,.jpg" files={p.file ? [p.file] : []} onFilesChange={files => handlePeriodChange(i, 'file', files.length > 0 ? files[0] : null)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Total Billed Amount</span>
                    <strong className="text-base text-gray-900 dark:text-gray-100">{formatINR(totalAmount)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Eligible Claim Amount (Cap: {formatINR(maxAllowed)})</span>
                    <strong className="text-lg text-samsung-blue dark:text-blue-400 font-semibold">{formatINR(claimable)}</strong>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4 border border-red-200 dark:border-red-800">
                    Please fill all required fields and upload all bill documents.
                  </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-border dark:border-slate-700 flex justify-between items-center">
                  <button type="button" onClick={() => navigate('/new-request')} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-sm">Cancel</button>
                  <div className="flex gap-3">
                    <button type="button" onClick={handleSaveDraft} className="px-6 py-2.5 rounded-md font-medium text-sm border border-border dark:border-slate-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
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
                <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-md border border-border dark:border-slate-700 mb-6">
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-gray-500 dark:text-slate-400">Provider:</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{provider}</div>
                    <div className="text-gray-500 dark:text-slate-400">Frequency:</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">{frequency} ({periods.length} periods)</div>
                    <div className="text-gray-500 dark:text-slate-400">Total Billed:</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{formatINR(totalAmount)}</div>
                    <div className="text-gray-500 dark:text-slate-400">Eligible Claim:</div>
                    <div className="font-medium text-samsung-blue dark:text-blue-400">{formatINR(claimable)}</div>
                  </div>
                </div>

                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Breakdown</h3>
                <div className="flex flex-col gap-2 mb-8">
                  {periods.map((p, i) => (
                    <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-700/50 p-3 rounded-md border border-gray-200 dark:border-slate-600 shadow-sm">
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{p.label}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">{p.file?.name}</div>
                      </div>
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{formatINR(p.amount)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-border dark:border-slate-700 flex justify-between items-center">
                  <button onClick={() => setStep(1)} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-sm">
                    ← Back to Edit
                  </button>
                  <div className="flex gap-3">
                    <button type="button" onClick={handleSaveDraft} className="px-6 py-2.5 rounded-md font-medium text-sm border border-border dark:border-slate-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200">
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
        <div className="w-full lg:w-[360px] shrink-0 xl:col-span-3 flex flex-col gap-6 sticky top-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-border dark:border-slate-700 shadow-sm">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-gray-100">
              <Info size={18} className="text-samsung-blue dark:text-blue-400" /> Policy Highlights
            </h3>
            
            <ul className="pl-5 list-disc text-gray-600 dark:text-slate-400 text-sm flex flex-col gap-3 mb-6 marker:text-samsung-blue dark:marker:text-blue-400">
              <li>Reimbursement is limited to your monthly cap of <strong className="text-gray-900 dark:text-gray-100">{formatINR(cap)}</strong>.</li>
              <li>Only broadband or mobile data plans used explicitly for remote work are eligible.</li>
              <li>You must attach a valid tax invoice (bill) for every period you are claiming.</li>
            </ul>

            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-gray-900 dark:text-gray-100 border-t border-gray-100 dark:border-slate-700 pt-4">
              <HelpCircle size={16} className="text-gray-400 dark:text-slate-500" /> FAQ
            </h3>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-0.5">Can I claim a prepaid plan?</p>
              <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">Yes, provided you have a valid receipt/invoice from the provider.</p>
              
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200 mb-0.5">What if my bill exceeds the cap?</p>
              <p className="text-xs text-gray-600 dark:text-slate-400">You will only be reimbursed up to your limit. The portal automatically calculates the eligible amount.</p>
            </div>
          </div>
        </div>

      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
