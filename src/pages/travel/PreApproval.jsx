import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { createTravelPreApproval, getRequestsByEmployee, saveDraftRequest, getRequestById } from '../../services/requests';
import { getDomesticCityTiers, getIntlCountryTiers, getRateConfig } from '../../services/rateConfig';
import FormField from '../../components/shared/FormField';
import Select from '../../components/shared/Select';
import Combobox from '../../components/shared/Combobox';
import UploadZone from '../../components/shared/UploadZone';
import Toast from '../../components/shared/Toast';
import { Info, PlaneTakeoff, Clock, CheckCircle } from 'lucide-react';
import { getDaysBetween } from '../../utils/dateHelpers';
import { formatDate } from '../../utils/formatters';

export default function PreApproval() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    subtype: 'domestic',
    startDate: '',
    endDate: '',
    purpose: '',
    destination: '',
    knoxApproval: [],
    travelInsurance: [],
    visa: [],
    passport: []
  });
  
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [recentTravel, setRecentTravel] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [policyRates, setPolicyRates] = useState(null);

  useEffect(() => {
    async function loadDestinationsAndRecent() {
      const cityMap = await getDomesticCityTiers();
      const countryMap = await getIntlCountryTiers();
      setCities(cityMap);
      setCountries(countryMap);

      try {
        const all = await getRequestsByEmployee(user.ghrId);
        const travels = all
          .filter(r => r.type === 'travel')
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        setRecentTravel(travels.slice(0, 3));
      } catch (err) {
        console.error("Failed to load recent travel requests", err);
      }
    }
    loadDestinationsAndRecent();
  }, [user.ghrId]);

  useEffect(() => {
    async function loadRates() {
      const cl = user.clLevel || 'CL3';
      if (formData.subtype === 'domestic') {
        const domesticHotel = await getRateConfig('domesticHotel');
        const perDiem = await getRateConfig('domesticPerDiem');
        
        const hotelRates = cl === 'CL3' ? domesticHotel?.rates?.['CL3']?.['under5'] : domesticHotel?.rates?.[cl];
        const pd = cl === 'CL3' ? perDiem?.rates?.['CL3']?.['under5'] : perDiem?.rates?.[cl];
        
        setPolicyRates({
          type: 'domestic',
          hotel: hotelRates || [],
          perDiem: pd?.value || 0
        });
      } else {
        const intlHotel = await getRateConfig('intlHotel');
        const intlPerDiem = await getRateConfig('intlPerDiem');
        setPolicyRates({
          type: 'international',
          hotel: intlHotel?.rates?.[cl] || intlHotel?.rates?.['CL3'] || [],
          perDiem: intlPerDiem?.rates?.[cl] || intlPerDiem?.rates?.['CL3'] || []
        });
      }
    }
    loadRates();
  }, [formData.subtype, user.clLevel]);

  useEffect(() => {
    async function loadDraft() {
      // Check local storage first
      const localDraftJson = localStorage.getItem(`draft_travel_${draftId || 'new'}`);
      if (localDraftJson) {
        try {
          const draft = JSON.parse(localDraftJson);
          if (draft.formData) setFormData(draft.formData);
          if (draft.step) setStep(draft.step);
          return; // If local draft exists, use it
        } catch (err) {
          console.error("Failed to parse local draft", err);
        }
      }

      if (draftId && draftId !== 'new') {
        try {
          const draft = await getRequestById(draftId);
          if (draft && draft.stage === 'draft' && draft.draftData) {
            setFormData(draft.draftData.formData);
            setStep(draft.draftData.step || 1);
          }
        } catch (err) {
          console.error("Failed to load draft", err);
        }
      }
    }
    loadDraft();
  }, [draftId]);

  const handleSaveDraft = async (isAuto = false) => {
    try {
      const draft = { formData, step };
      localStorage.setItem(`draft_travel_${draftId || 'new'}`, JSON.stringify(draft));
      const msg = isAuto === true 
        ? t('preapproval.missingDocsDraft', 'Missing required documents. Saved as draft.') 
        : t('preapproval.saveDraft', 'Saved as draft');
      navigate('/requests', { state: { toastMessage: msg, toastType: 'success' } });
    } catch (err) {
      setToast({ visible: true, message: 'Failed to save draft: ' + err.message, type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Check for missing documents
    const missingDocs = [];
    if (!formData.knoxApproval || formData.knoxApproval.length === 0) missingDocs.push('Knox Approval');
    if (!formData.travelInsurance || formData.travelInsurance.length === 0) missingDocs.push('Travel Insurance');
    if (formData.subtype === 'international') {
      if (!formData.visa || formData.visa.length === 0) missingDocs.push('Visa');
      if (!formData.passport || formData.passport.length === 0) missingDocs.push('Passport');
    }

    if (missingDocs.length > 0) {
      await handleSaveDraft(true);
      return;
    }

    setLoading(true);
    try {
      await createTravelPreApproval({
        ghrId: user.ghrId,
        draftId,
        ...formData
      });
      setToast({ visible: true, message: 'Pre-Approval submitted successfully', type: 'success' });
      localStorage.removeItem(`draft_travel_${draftId || 'new'}`);
      setTimeout(() => navigate('/requests'), 1500);
    } catch (err) {
      setToast({ visible: true, message: err.message || 'Something went wrong, please try again', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const activeDestinations = formData.subtype === 'domestic' 
    ? cities.map(c => ({ label: c.cityName, value: c.cityName }))
    : countries.map(c => ({ label: c.countryOrCity, value: c.countryOrCity }));

  const selectedTierInfo = useMemo(() => {
    if (!formData.destination) return null;
    if (formData.subtype === 'domestic') {
      const city = cities.find(c => c.cityName === formData.destination);
      return city ? city.tier : 'C';
    } else {
      const country = countries.find(c => c.countryOrCity === formData.destination);
      return country ? country.tier : 'C';
    }
  }, [formData.destination, formData.subtype, cities, countries]);

  const displayRate = useMemo(() => {
    if (!policyRates || !selectedTierInfo) return null;
    let tierIndex = 0;
    
    if (formData.subtype === 'domestic') {
      if (selectedTierInfo === 'A+') tierIndex = 0;
      else if (selectedTierInfo === 'A') tierIndex = 1;
      else if (selectedTierInfo === 'B') tierIndex = 2;
      else tierIndex = 3; // C
      
      const hotelRate = policyRates.hotel[tierIndex];
      return {
        hotel: hotelRate === null ? 'Actuals' : `₹${hotelRate.toLocaleString('en-IN')}`,
        perDiem: `₹${policyRates.perDiem.toLocaleString('en-IN')}`
      };
    } else {
      if (selectedTierInfo === 'A') tierIndex = 0;
      else if (selectedTierInfo === 'B') tierIndex = 1;
      else if (selectedTierInfo === 'C') tierIndex = 2;
      
      if (selectedTierInfo === 'Japan') {
        return { hotel: '¥15,000 (Est)', perDiem: '¥8,000 (Est)' };
      }
      
      return {
        hotel: `$${policyRates.hotel[tierIndex] || '-'}`,
        perDiem: `$${policyRates.perDiem[tierIndex] || '-'}`
      };
    }
  }, [policyRates, selectedTierInfo, formData.subtype]);

  const estimatedTotal = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !policyRates || !selectedTierInfo) return null;
    
    const days = getDaysBetween(formData.startDate, formData.endDate);
    if (days <= 0 || isNaN(days)) return null;

    let tierIndex = 0;
    let currencySymbol = formData.subtype === 'domestic' ? '₹' : (selectedTierInfo === 'Japan' ? '¥' : '$');
    let hotelVal = 0;
    let pdVal = 0;

    if (formData.subtype === 'domestic') {
      if (selectedTierInfo === 'A+') tierIndex = 0;
      else if (selectedTierInfo === 'A') tierIndex = 1;
      else if (selectedTierInfo === 'B') tierIndex = 2;
      else tierIndex = 3; 
      
      hotelVal = policyRates.hotel[tierIndex] === null ? 0 : policyRates.hotel[tierIndex];
      pdVal = policyRates.perDiem || 0;
    } else {
      if (selectedTierInfo === 'A') tierIndex = 0;
      else if (selectedTierInfo === 'B') tierIndex = 1;
      else if (selectedTierInfo === 'C') tierIndex = 2;
      
      if (selectedTierInfo === 'Japan') {
        hotelVal = 15000;
        pdVal = 8000;
      } else {
        hotelVal = policyRates.hotel[tierIndex] || 0;
        pdVal = policyRates.perDiem[tierIndex] || 0;
      }
    }
    
    const pdTotal = days * pdVal;
    let hotelStr = '';
    
    // For Actuals or 0 cap, we don't multiply
    let hotelTotal = 0;
    if (hotelVal === 0) {
      hotelStr = ' + Actual Hotel';
    } else {
      // Hotel is claimed for days - 1
      hotelTotal = Math.max(0, days - 1) * hotelVal;
    }

    const totalNum = pdTotal + hotelTotal;
    const fmt = (num) => new Intl.NumberFormat('en-IN').format(num);

    return {
      days,
      text: `${currencySymbol}${fmt(totalNum)}${hotelStr}`
    };

  }, [formData.startDate, formData.endDate, policyRates, selectedTierInfo, formData.subtype]);

  return (
    <div className="p-6 w-full max-w-none mx-auto flex flex-col gap-6">
      <button 
        onClick={() => navigate('/new-request')}
        className="text-samsung-blue text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer w-max focus:outline-none"
      >
        ← Back to request types
      </button>
      
      <div className="pb-4 border-b border-border dark:border-slate-700 bg-gradient-to-b from-blue-50/30 dark:from-slate-800/50 to-transparent -mx-6 px-6 pt-2 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100">Travel Pre-Approval</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 dark:text-slate-400 mt-1">Step {step} of 2: {step === 1 ? 'Obtain approval before traveling' : 'Review Submission'}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="flex-1 min-w-0 xl:col-span-9 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-t-4 border-samsung-blue border-l border-r border-b border-border dark:border-gray-700">
          <div className="px-6 md:px-8 py-5 border-b border-border dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 m-0">Pre-Approval Form</h2>
          </div>
          
          <form onSubmit={e => { e.preventDefault(); if (step === 1) setStep(2); else handleSubmit(e); }} className="p-6 md:p-8 w-full">
            {step === 1 && (
              <div className="flex flex-col gap-6">
                
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="subtype" 
                      value="domestic" 
                      className="text-samsung-blue focus:ring-samsung-blue border-gray-300 dark:border-gray-600 dark:bg-gray-900"
                      checked={formData.subtype === 'domestic'}
                      onChange={() => setFormData({...formData, subtype: 'domestic', destination: ''})}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Domestic</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="subtype" 
                      value="international" 
                      className="text-samsung-blue focus:ring-samsung-blue border-gray-300 dark:border-gray-600 dark:bg-gray-900"
                      checked={formData.subtype === 'international'}
                      onChange={() => setFormData({...formData, subtype: 'international', destination: ''})}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">International</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField id="startDate" label="Start Date" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                  <FormField id="endDate" label="End Date" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required />
                </div>

                <Combobox 
                  id="destination" 
                  label="Destination" 
                  options={activeDestinations} 
                  value={formData.destination} 
                  onChange={e => setFormData({...formData, destination: e.target.value})} 
                  placeholder="Select a destination..."
                  required 
                />

                <FormField 
                  id="purpose" 
                  label="Purpose of Visit" 
                  type="textarea" 
                  value={formData.purpose} 
                  onChange={e => setFormData({...formData, purpose: e.target.value})} 
                  required 
                />
                
                <div className="mt-8 border-t border-border pt-6">
                    <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-gray-100">{t('preapproval.documents', 'Supporting Documents')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <UploadZone 
                        id="knoxApproval" 
                        label="Knox Approval" 
                        accept=".pdf,.png,.jpg" 
                        files={formData.knoxApproval}
                        onFilesChange={(f) => setFormData({...formData, knoxApproval: f})}
                      />
                      <UploadZone 
                        id="travelInsurance" 
                        label="Travel Insurance" 
                        accept=".pdf,.png,.jpg" 
                        files={formData.travelInsurance}
                        onFilesChange={(f) => setFormData({...formData, travelInsurance: f})}
                      />
                      {formData.subtype === 'international' && (
                        <>
                          <UploadZone 
                            id="visa" 
                            label="Visa" 
                            accept=".pdf,.png,.jpg" 
                            files={formData.visa}
                            onFilesChange={(f) => setFormData({...formData, visa: f})}
                          />
                          <UploadZone 
                            id="passport" 
                            label="Passport" 
                            accept=".pdf,.png,.jpg" 
                            files={formData.passport}
                            onFilesChange={(f) => setFormData({...formData, passport: f})}
                          />
                        </>
                      )}
                    </div>
                  </div>

              </div>
            )}

            {step === 2 && (
              <div>
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100 border-b border-border dark:border-gray-700 pb-2">Trip Overview</h3>
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-gray-500 dark:text-gray-400">Trip Type:</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">{formData.subtype}</div>
                    <div className="text-gray-500 dark:text-gray-400">Destination:</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{formData.destination}</div>
                    <div className="text-gray-500 dark:text-gray-400">Travel Dates:</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{formData.startDate} to {formData.endDate}</div>
                    <div className="text-gray-500 dark:text-gray-400">Purpose:</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{formData.purpose}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100 border-b border-border dark:border-gray-700 pb-2">Attached Documents</h3>
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="text-gray-500 dark:text-gray-400">Knox Approval:</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{formData.knoxApproval[0]?.name || 'Pending'}</div>
                    <div className="text-gray-500 dark:text-gray-400">Insurance:</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{formData.travelInsurance[0]?.name || 'Pending'}</div>
                    {formData.subtype === 'international' && (
                      <>
                        <div className="text-gray-500 dark:text-gray-400">Visa:</div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{formData.visa[0]?.name || 'Pending'}</div>
                        <div className="text-gray-500 dark:text-gray-400">Passport:</div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{formData.passport[0]?.name || 'Pending'}</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-orange-50 text-orange-700 p-4 rounded-md text-sm mb-4 border border-orange-200">
                  Once submitted, you cannot modify this pre-approval request until Finance reviews it.
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-border dark:border-gray-700 flex justify-between items-center">
              {step === 1 ? (
                <>
                  <button type="button" onClick={() => navigate('/new-request')} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-sm">Cancel</button>
                  <div className="flex gap-3">
                    <button type="button" onClick={handleSaveDraft} className="px-6 py-2.5 rounded-md font-medium text-sm border border-border dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:outline-none">
                      Save as Draft
                    </button>
                    <button type="submit" className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue">
                      Review & Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setStep(1)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium text-sm">← Back to Edit</button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => handleSaveDraft(false)} className="px-6 py-2.5 rounded-md font-medium text-sm border border-border dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:outline-none">
                      {t('preapproval.saveDraft', 'Save as Draft')}
                    </button>
                    <button type="submit" disabled={loading} className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed">
                      {loading ? 'Submitting...' : t('preapproval.submit', 'Submit Pre-Approval')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Contextual Info */}
        <div className="w-full lg:w-[360px] shrink-0 xl:col-span-3 flex flex-col gap-6 sticky top-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-border dark:border-gray-700 shadow-sm">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-5 text-gray-900 dark:text-gray-100">
              <Info size={18} className="text-samsung-blue dark:text-blue-400" /> What you'll need
            </h3>
            
            <ul className="pl-5 list-disc text-gray-600 dark:text-gray-400 text-sm flex flex-col gap-2 mb-6 marker:text-samsung-blue">
              <li>Purpose of visit details</li>
              {formData.subtype === 'international' ? (
                <>
                  <li><strong className="text-gray-900 dark:text-gray-200">Knox Approval</strong></li>
                  <li><strong className="text-gray-900 dark:text-gray-200">Travel Insurance</strong></li>
                  <li><strong className="text-gray-900 dark:text-gray-200">Visa & Passport</strong></li>
                </>
              ) : (
                <>
                  <li><strong className="text-gray-900 dark:text-gray-200">Knox Approval</strong></li>
                  <li><strong className="text-gray-900 dark:text-gray-200">Travel Insurance</strong></li>
                </>
              )}
              <li className="text-gray-500 italic mt-2">Note: Missing documents will result in an auto-draft.</li>
            </ul>

            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              Applicable Rates
            </h4>
            
            {formData.destination ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Based on <strong className="text-gray-700 dark:text-gray-200">{user.clLevel || 'CL3'}</strong> traveling to <strong className="text-gray-700 dark:text-gray-200">{formData.destination}</strong> (Tier {selectedTierInfo})
                </p>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-md border border-border dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Hotel Cap:</span>
                  <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{displayRate?.hotel}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-md border border-border dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Per Diem:</span>
                  <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{displayRate?.perDiem} / day</span>
                </div>

                {estimatedTotal && (
                  <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-3 rounded-md">
                    <div className="text-xs font-mono uppercase tracking-wide text-samsung-blue dark:text-blue-400 mb-1">Estimated Total ({estimatedTotal.days} days)</div>
                    <div className="font-mono text-lg font-bold text-gray-900 dark:text-gray-100">{estimatedTotal.text}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Excludes flight/train tickets</div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md border border-border dark:border-gray-700 text-center">
                Select a destination to view your per diem and hotel caps.
              </p>
            )}
          </div>

          {/* Recent Travel Context */}
          {recentTravel.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-border dark:border-gray-700 shadow-sm">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-gray-100 border-b border-border dark:border-gray-700 pb-2">
                <PlaneTakeoff size={16} className="text-gray-400 dark:text-gray-500" /> Your recent Travel requests
              </h3>
              <div className="flex flex-col gap-4">
                {recentTravel.map(req => (
                  <div key={req.id} className="flex justify-between items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1 -mx-1 rounded" onClick={() => navigate(`/requests/${req.id}`)}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[150px]" title={req.destination}>{req.destination}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(req.submittedAt)}</span>
                    </div>
                    {req.settlementStatus === 'approved' ? (
                      <CheckCircle size={16} className="text-status-approved mt-1" />
                    ) : (
                      <Clock size={16} className="text-orange-500 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
