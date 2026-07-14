import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequestById, submitSettlement } from '../../services/requests';
import { getRateConfig, getIntlCountryTiers } from '../../services/rateConfig';
import { getDaysBetween } from '../../utils/dateHelpers';
import { useAuth } from '../../context/AuthContext';
import FormField from '../../components/shared/FormField';
import Select from '../../components/shared/Select';
import UploadZone from '../../components/shared/UploadZone';
import Toast from '../../components/shared/Toast';
import { Info, HelpCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function Settlement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [step, setStep] = useState(1); // 1: Edit, 2: Review
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [hotelCost, setHotelCost] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [conveyanceType, setConveyanceType] = useState('cab');
  const [conveyanceAmount, setConveyanceAmount] = useState('');
  const [ownVehicleKm, setOwnVehicleKm] = useState('');
  const [winterClothesClaimed, setWinterClothesClaimed] = useState(false);
  const [winterClothesAmount, setWinterClothesAmount] = useState('');
  
  const [hotelBill, setHotelBill] = useState([]);
  const [conveyanceReceipt, setConveyanceReceipt] = useState([]);
  const [otherDocument, setOtherDocument] = useState([]);
  
  const [policyRates, setPolicyRates] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getRequestById(id);
        setRequest(data);
        
        // Load Draft
        const draftJson = localStorage.getItem(`draft_settlement_${id}`);
        if (draftJson) {
          const draft = JSON.parse(draftJson);
          setHotelCost(draft.hotelCost || '');
          setHotelName(draft.hotelName || '');
          setConveyanceType(draft.conveyanceType || 'cab');
          setConveyanceAmount(draft.conveyanceAmount || '');
          setOwnVehicleKm(draft.ownVehicleKm || '');
          setWinterClothesClaimed(draft.winterClothesClaimed || false);
          setWinterClothesAmount(draft.winterClothesAmount || '');
        }

        // Fetch per diem
        const cl = user.clLevel || 'CL3';
        if (data.subtype === 'domestic') {
          const perDiem = await getRateConfig('domesticPerDiem');
          const pd = cl === 'CL3' ? perDiem?.rates?.['CL3']?.['under5'] : perDiem?.rates?.[cl];
          setPolicyRates({ perDiem: pd?.value || 0 });
        } else {
          const intlPerDiem = await getRateConfig('intlPerDiem');
          const pdRates = intlPerDiem?.rates?.[cl] || intlPerDiem?.rates?.['CL3'] || [];
          
          let tierIndex = 0;
          if (data.destination === 'Japan') {
            setPolicyRates({ perDiem: 8000 });
          } else {
            const countries = await getIntlCountryTiers();
            const country = countries.find(c => c.countryOrCity === data.destination);
            const tier = country ? country.tier : 'C';
            if (tier === 'A') tierIndex = 0;
            else if (tier === 'B') tierIndex = 1;
            else if (tier === 'C') tierIndex = 2;
            setPolicyRates({ perDiem: pdRates[tierIndex] || 0 });
          }
        }
      } catch (err) {
        setToast({ visible: true, message: 'Failed to load request', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, user.clLevel]);

  const handleSaveDraft = () => {
    const draft = {
      hotelCost, hotelName, conveyanceType, conveyanceAmount, ownVehicleKm, winterClothesClaimed, winterClothesAmount
    };
    localStorage.setItem(`draft_settlement_${id}`, JSON.stringify(draft));
    setToast({ visible: true, message: 'Draft saved locally', type: 'success' });
  };

  const handleNext = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const convAmount = conveyanceType === 'own_vehicle' 
        ? ((Number(ownVehicleKm) || 0) / 12) * 100 // Assuming 12km/L and 100Rs/L
        : Number(conveyanceAmount) || 0;

      const docs = [...hotelBill];
      if (conveyanceReceipt.length > 0) docs.push(...conveyanceReceipt);
      if (otherDocument.length > 0) docs.push(...otherDocument);

      await submitSettlement(id, {
        hotelName,
        flightActual: 0,
        hotelActual: Number(hotelCost) || 0,
        conveyanceActual: convAmount,
        conveyanceDetails: conveyanceType === 'own_vehicle' ? `${ownVehicleKm} km via own vehicle` : 'Cab/Taxi',
        winterClothesActual: winterClothesClaimed ? (Number(winterClothesAmount) || 0) : 0,
        documents: docs
      });
      setToast({ visible: true, message: 'Settlement submitted successfully', type: 'success' });
      
      // Clear draft
      localStorage.removeItem(`draft_settlement_${id}`);
      setTimeout(() => navigate(`/requests/${id}`), 1500);
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading settlement...</div>;
  if (!request) return <div className="p-6">Request not found.</div>;

  const isIntl = request.subtype === 'international';
  const currency = isIntl ? (request.destination === 'Japan' ? 'JPY' : 'USD') : 'INR';

  const tripSummary = useMemo(() => {
    if (!request?.dates || !policyRates) return null;
    const days = getDaysBetween(request.dates.startDate, request.dates.endDate);
    if (days <= 0 || isNaN(days)) return null;
    const pdTotal = days * policyRates.perDiem;
    
    return {
      startDate: request.dates.startDate,
      endDate: request.dates.endDate,
      days,
      perDiemRate: policyRates.perDiem,
      pdTotal
    };
  }, [request, policyRates]);

  return (
    <div className="p-6 w-full max-w-none mx-auto flex flex-col gap-6">
      <button 
        onClick={() => navigate(`/requests/${id}`)}
        className="text-samsung-blue text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer w-max focus:outline-none"
      >
        ← Back to Request Details
      </button>
      
      <div className="pb-4 border-b border-border dark:border-slate-700 bg-gradient-to-b from-blue-50/30 dark:from-slate-800/50 to-transparent -mx-6 px-6 pt-2 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100">Submit Settlement</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 dark:text-slate-400 mt-1">Step {step} of 2: {step === 1 ? 'Provide Details' : 'Review Claim'}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="flex-1 min-w-0 xl:col-span-9 bg-white rounded-lg shadow-sm border-t-4 border-samsung-blue border-l border-r border-b border-border">
          <div className="px-6 md:px-8 py-5 border-b border-border flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-semibold text-gray-900 m-0">Settlement Details</h2>
            <span className="text-xs font-mono uppercase tracking-wide text-gray-400">Draft auto-saved</span>
          </div>

          <div className="p-6 md:p-8 w-full">
            {step === 1 && (
              <form onSubmit={handleNext}>
                <div className="flex flex-col gap-6">
                  
                  <div className="border-b border-border pb-6 mb-2">
                    <h3 className="font-semibold text-gray-900 mb-4">Travel Expenses</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField id="hotelName" label="Hotel Name" value={hotelName} onChange={e => setHotelName(e.target.value)} required />
                      <FormField id="hotelCost" label={`Total Hotel Bill (${currency})`} type="number" value={hotelCost} onChange={e => setHotelCost(e.target.value)} required />
                    </div>
                  </div>

                  <div className="border-b border-border pb-6 mb-2">
                    <h3 className="font-semibold text-gray-900 mb-4">Local Conveyance</h3>
                    <div className="flex gap-4 mb-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="convType" value="cab" checked={conveyanceType === 'cab'} onChange={() => setConveyanceType('cab')} className="text-samsung-blue" />
                        <span className="text-sm text-gray-900">Cab / Taxi</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="convType" value="own_vehicle" checked={conveyanceType === 'own_vehicle'} onChange={() => setConveyanceType('own_vehicle')} className="text-samsung-blue" />
                        <span className="text-sm text-gray-900">Own Vehicle</span>
                      </label>
                    </div>
                    <div className="max-w-md">
                      {conveyanceType === 'cab' ? (
                        <FormField id="conveyanceAmount" label={`Total Conveyance (${currency})`} type="number" value={conveyanceAmount} onChange={e => setConveyanceAmount(e.target.value)} required />
                      ) : (
                        <FormField id="ownVehicleKm" label="Total Distance (km)" type="number" value={ownVehicleKm} onChange={e => setOwnVehicleKm(e.target.value)} required />
                      )}
                    </div>
                  </div>

                  {isIntl && (
                    <div className="border-b border-border pb-6 mb-2">
                      <h3 className="font-semibold text-gray-900 mb-4">Winter Clothes Allowance</h3>
                      <label className="flex items-start gap-3 cursor-pointer p-4 bg-blue-50 border border-blue-100 rounded-md">
                        <input type="checkbox" checked={winterClothesClaimed} onChange={e => setWinterClothesClaimed(e.target.checked)} className="mt-0.5 text-samsung-blue" />
                        <span className="text-sm text-gray-900 leading-snug">I am claiming the winter clothes allowance (Eligible for 30+ days in Korea. Claim once in 3 years).</span>
                      </label>
                      {winterClothesClaimed && (
                        <div className="mt-5 max-w-md">
                          <FormField id="winterClothesAmount" label={`Allowance Claim Amount (${currency})`} type="number" value={winterClothesAmount} onChange={e => setWinterClothesAmount(e.target.value)} required />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Supporting Documents</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <UploadZone id="hotelBill" label="Hotel Bill" accept=".pdf,.png,.jpg" multiple files={hotelBill} onFilesChange={setHotelBill} required />
                      <UploadZone 
                        id="conveyanceReceipt" 
                        label="Conveyance Receipt" 
                        accept=".pdf,.png,.jpg" 
                        multiple 
                        files={conveyanceReceipt} 
                        onFilesChange={setConveyanceReceipt} 
                        required={conveyanceType === 'cab'}
                      />
                      <UploadZone id="otherDocument" label="Other Supporting Document (Optional)" accept=".pdf,.png,.jpg" multiple files={otherDocument} onFilesChange={setOtherDocument} />
                    </div>
                  </div>

                </div>
                
                <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
                  <button type="button" onClick={handleSaveDraft} className="text-samsung-blue hover:text-blue-800 font-medium text-sm focus:outline-none">Save Draft</button>
                  <button type="submit" className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue">
                    Review Claim & Next
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div>
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-gray-900 border-b border-border pb-2">Review Settlement Details</h3>
                  <div className="grid grid-cols-2 gap-y-4 text-sm text-gray-700">
                    <div><strong className="text-gray-900">Hotel ({hotelName}):</strong></div>
                    <div>{formatCurrency(Number(hotelCost), currency)}</div>
                    
                    <div><strong className="text-gray-900">Conveyance:</strong></div>
                    <div>{conveyanceType === 'cab' ? formatCurrency(Number(conveyanceAmount), currency) : `${ownVehicleKm} km (Own Vehicle)`}</div>
                    
                    {isIntl && winterClothesClaimed && (
                      <>
                        <div><strong className="text-gray-900">Winter Clothes:</strong></div>
                        <div>{formatCurrency(Number(winterClothesAmount), currency)}</div>
                      </>
                    )}

                    <div><strong className="text-gray-900">Receipts Attached:</strong></div>
                    <div>{hotelBill.length + conveyanceReceipt.length + otherDocument.length} file(s)</div>
                  </div>
                </div>

                <div className="bg-orange-50 text-orange-700 p-4 rounded-md text-sm mt-6 border border-orange-200">
                  Per diem and hotel caps will be computed automatically by the system upon submission. Once submitted, this claim cannot be edited.
                </div>

                <div className="mt-6 pt-6 border-t border-border flex justify-between items-center">
                  <button type="button" onClick={() => setStep(1)} className="text-gray-600 hover:text-gray-900 font-medium text-sm">← Back to Edit</button>
                  <button onClick={handleSubmit} disabled={submitting} className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed">
                    {submitting ? 'Submitting...' : 'Confirm & Submit'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contextual Info */}
        <div className="w-full lg:w-[360px] shrink-0 xl:col-span-3 flex flex-col gap-6 sticky top-6">
          
          {tripSummary && (
            <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
              <h3 className="text-sm font-semibold mb-4 text-gray-900 border-b border-border pb-2">Trip Summary</h3>
              <div className="flex flex-col gap-3 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Travel Dates:</span>
                  <strong className="text-gray-900 text-right">{formatDate(tripSummary.startDate)}<br/>to {formatDate(tripSummary.endDate)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <strong className="text-gray-900">{tripSummary.days} days</strong>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                  <span className="text-gray-500 leading-tight">Per Diem<br/><span className="text-xs">({formatCurrency(tripSummary.perDiemRate, currency)} × {tripSummary.days})</span></span>
                  <strong className="font-mono text-samsung-blue font-semibold">{formatCurrency(tripSummary.pdTotal, currency)}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-sm font-semibold mb-4 text-gray-900 border-b border-border pb-2">Pre-Approval Reference</h3>
            <div className="flex flex-col gap-3 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Destination:</span>
                <strong className="text-gray-900">{request.destination}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="capitalize font-medium text-gray-900">{request.subtype}</span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-gray-500">Dates:</span>
                <strong className="text-gray-900">{formatDate(request.dates.startDate)} to {formatDate(request.dates.endDate)}</strong>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900">
              <Info size={18} className="text-samsung-blue" /> Policy Reminders
            </h3>
            
            <ul className="pl-5 list-disc text-gray-600 text-sm flex flex-col gap-3 mb-6 marker:text-samsung-blue">
              <li>Hotel caps strictly apply as per the tier of your destination. Any excess is non-reimbursable.</li>
              <li>Per diem is calculated automatically based on the number of days you stayed.</li>
              <li>You must upload all supporting documents, including boarding passes and GST-compliant invoices.</li>
            </ul>

            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-gray-900 border-t border-gray-100 pt-4">
              <HelpCircle size={16} className="text-gray-400" /> FAQ
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800 mb-0.5">Where is the Per Diem input?</p>
                <p className="text-xs text-gray-600">The system calculates per diem dynamically based on your pre-approval dates and destination. You do not need to input it.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
