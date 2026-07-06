import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createTravelPreApproval } from '../../services/requests';
import { getDomesticCityTiers, getIntlCountryTiers, getRateConfig } from '../../services/rateConfig';
import FormField from '../../components/shared/FormField';
import Select from '../../components/shared/Select';
import UploadZone from '../../components/shared/UploadZone';
import Toast from '../../components/shared/Toast';
import { Info } from 'lucide-react';

export default function PreApproval() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
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
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  const [policyRates, setPolicyRates] = useState(null);

  useEffect(() => {
    async function loadDestinations() {
      const cityMap = await getDomesticCityTiers();
      const countryMap = await getIntlCountryTiers();
      setCities(cityMap);
      setCountries(countryMap);
    }
    loadDestinations();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTravelPreApproval({
        ghrId: user.ghrId,
        ...formData
      });
      setToast({ visible: true, message: 'Pre-Approval submitted successfully', type: 'success' });
      setTimeout(() => navigate('/employee/requests'), 1500);
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
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
        hotel: hotelRate === null ? 'Actuals' : `₹${hotelRate}`,
        perDiem: `₹${policyRates.perDiem}`
      };
    } else {
      if (selectedTierInfo === 'A') tierIndex = 0;
      else if (selectedTierInfo === 'B') tierIndex = 1;
      else if (selectedTierInfo === 'C') tierIndex = 2;
      
      if (selectedTierInfo === 'Japan') {
        return { hotel: '¥15,000 (Est)', perDiem: '¥8,000 (Est)' }; // Simplification for display
      }
      
      return {
        hotel: `$${policyRates.hotel[tierIndex] || '-'}`,
        perDiem: `$${policyRates.perDiem[tierIndex] || '-'}`
      };
    }
  }, [policyRates, selectedTierInfo, formData.subtype]);

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <button 
        onClick={() => navigate('/employee/new-request')}
        className="text-samsung-blue text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer w-max focus:outline-none"
      >
        ← Back to request types
      </button>
      
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Travel Pre-Approval</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">Step 1 of 2: Obtain approval before traveling</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-8 bg-white rounded-lg shadow-sm border-t-4 border-samsung-blue border-l border-r border-b border-border">
          <div className="px-6 md:px-8 py-5 border-b border-border flex justify-between items-center">
            <h2 className="text-base font-semibold text-gray-900 m-0">Request Details</h2>
            <span className="text-xs font-mono uppercase tracking-wide text-gray-400">Draft auto-saved</span>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="subtype" 
                    value="domestic" 
                    className="text-samsung-blue focus:ring-samsung-blue border-gray-300"
                    checked={formData.subtype === 'domestic'}
                    onChange={() => setFormData({...formData, subtype: 'domestic', destination: ''})}
                  />
                  <span className="text-sm font-medium text-gray-900">Domestic</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="subtype" 
                    value="international" 
                    className="text-samsung-blue focus:ring-samsung-blue border-gray-300"
                    checked={formData.subtype === 'international'}
                    onChange={() => setFormData({...formData, subtype: 'international', destination: ''})}
                  />
                  <span className="text-sm font-medium text-gray-900">International</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField id="startDate" label="Start Date" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                <FormField id="endDate" label="End Date" type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required />
              </div>

              <Select 
                id="destination" 
                label="Destination" 
                options={activeDestinations} 
                value={formData.destination} 
                onChange={e => setFormData({...formData, destination: e.target.value})} 
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
                <UploadZone 
                  id="knoxApproval" 
                  label="Knox Approval" 
                  accept=".pdf,.png,.jpg" 
                  files={formData.knoxApproval}
                  onFilesChange={(f) => setFormData({...formData, knoxApproval: f})}
                  required 
                />
                <UploadZone 
                  id="travelInsurance" 
                  label="Travel Insurance" 
                  accept=".pdf,.png,.jpg" 
                  files={formData.travelInsurance}
                  onFilesChange={(f) => setFormData({...formData, travelInsurance: f})}
                  required 
                />
                {formData.subtype === 'international' && (
                  <>
                    <UploadZone 
                      id="visa" 
                      label="Visa" 
                      accept=".pdf,.png,.jpg" 
                      files={formData.visa}
                      onFilesChange={(f) => setFormData({...formData, visa: f})}
                      required 
                    />
                    <UploadZone 
                      id="passport" 
                      label="Passport" 
                      accept=".pdf,.png,.jpg" 
                      files={formData.passport}
                      onFilesChange={(f) => setFormData({...formData, passport: f})}
                      required 
                    />
                  </>
                )}
              </div>

            </div>
            
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <button type="submit" disabled={loading} className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Submitting...' : 'Submit Pre-Approval'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Contextual Info */}
        <div className="lg:col-span-4 sticky top-6">
          <div className="bg-white p-6 rounded-lg border border-border">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-5 text-gray-900">
              <Info size={18} className="text-samsung-blue" /> What you'll need
            </h3>
            
            <ul className="pl-5 list-disc text-gray-600 text-sm flex flex-col gap-2 mb-6 marker:text-samsung-blue">
              <li>Purpose of visit details</li>
              {formData.subtype === 'international' ? (
                <>
                  <li><strong className="text-gray-900">Knox Approval</strong> (Required)</li>
                  <li><strong className="text-gray-900">Travel Insurance</strong> (Required)</li>
                  <li><strong className="text-gray-900">Visa & Passport</strong> (Required)</li>
                </>
              ) : (
                <>
                  <li><strong className="text-gray-900">Knox Approval</strong> (Required)</li>
                  <li><strong className="text-gray-900">Travel Insurance</strong> (Required)</li>
                </>
              )}
            </ul>

            <h4 className="text-sm font-semibold text-gray-900 mb-4 border-t border-gray-100 pt-4">
              Applicable Rates
            </h4>
            
            {formData.destination ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500 mb-2">
                  Based on <strong className="text-gray-700">{user.clLevel || 'CL3'}</strong> traveling to <strong className="text-gray-700">{formData.destination}</strong> (Tier {selectedTierInfo})
                </p>
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-md border border-border">
                  <span className="text-sm text-gray-600">Hotel Cap:</span>
                  <span className="font-mono text-sm font-semibold text-gray-900">{displayRate?.hotel}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-md border border-border">
                  <span className="text-sm text-gray-600">Per Diem:</span>
                  <span className="font-mono text-sm font-semibold text-gray-900">{displayRate?.perDiem} / day</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-md border border-border text-center">
                Select a destination to view your per diem and hotel caps.
              </p>
            )}
            
          </div>
        </div>

      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
