import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Wifi, Car, Truck } from 'lucide-react';
import FormField from '../../components/shared/FormField';
import UploadZone from '../../components/shared/UploadZone';
import Select from '../../components/shared/Select';
import Toast from '../../components/shared/Toast';
import { createInternetRequest, createCarpoolRequest, createRelocationRequest } from '../../services/requests';
import { useAuth } from '../../context/AuthContext';

export default function NewRequest() {
  const [activeTab, setActiveTab] = useState('travel');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  // Internet State
  const [internetData, setInternetData] = useState({ month: '', noOfMonths: '1', amount: '', isSelfDeclared: false, declarationText: '' });
  
  // Carpool State
  const [carpoolData, setCarpoolData] = useState({ vehicleType: 'own', claimType: 'both_way', distance: '', amount: '', confirmation: false });
  
  // Relocation State
  const [relocationItems, setRelocationItems] = useState([{ component: 'Accommodation', claimedAmount: '' }]);

  const handleInternetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createInternetRequest({
        ghrId: user.ghrId,
        month: internetData.month,
        noOfMonths: Number(internetData.noOfMonths),
        amount: Number(internetData.amount),
        isSelfDeclared: internetData.isSelfDeclared,
        declarationText: internetData.declarationText
      });
      setToast({ visible: true, message: 'Internet request submitted successfully', type: 'success' });
      setTimeout(() => navigate('/employee/requests'), 1500);
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
      setLoading(false);
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
        vehicleType: carpoolData.vehicleType,
        claimType: carpoolData.claimType,
        distance: Number(carpoolData.distance),
        amount: Number(carpoolData.amount)
      });
      setToast({ visible: true, message: 'Carpool request submitted successfully', type: 'success' });
      setTimeout(() => navigate('/employee/requests'), 1500);
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
      setLoading(false);
    }
  };

  const handleRelocationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createRelocationRequest({
        ghrId: user.ghrId,
        relocationLineItems: relocationItems.map(item => ({
          component: item.component,
          claimedAmount: Number(item.claimedAmount)
        }))
      });
      setToast({ visible: true, message: 'Relocation request submitted successfully', type: 'success' });
      setTimeout(() => navigate('/employee/requests'), 1500);
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'travel', label: 'Travel', icon: Plane },
    { id: 'internet', label: 'Internet', icon: Wifi },
    { id: 'carpool', label: 'Carpool', icon: Car },
    { id: 'relocation', label: 'Relocation', icon: Truck },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="font-serif text-2xl font-semibold text-gray-900 mb-2">New Reimbursement Request</h1>

      <div className="flex gap-2 border-b border-border mb-2 overflow-x-auto" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 bg-transparent border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-samsung-blue text-samsung-blue font-semibold' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-lg border-t-4 border-samsung-blue border-l border-r border-b border-border shadow-sm">
        {activeTab === 'travel' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-md bg-blue-50 text-samsung-blue flex items-center justify-center flex-shrink-0">
                  <Plane size={24} />
                </div>
                <h2 className="font-serif text-xl font-medium text-gray-900 m-0">Travel Pre-Approval</h2>
              </div>
              <p className="text-gray-600 mb-8 leading-relaxed">
                All travel requires pre-approval before settlement can be claimed. Start the two-stage travel flow to declare your destination, dates, and estimated expenses.
              </p>
              <button
                onClick={() => navigate('/employee/new-request/travel')}
                className="bg-samsung-blue text-white px-6 py-3 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue"
              >
                Start Pre-Approval
              </button>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-md border border-border">
              <h3 className="text-sm font-semibold mb-4 text-gray-900">What you'll need</h3>
              <ul className="flex flex-col gap-3 text-sm text-gray-700">
                <li className="flex items-start gap-2"><span className="text-samsung-blue">•</span> Destination and dates</li>
                <li className="flex items-start gap-2"><span className="text-samsung-blue">•</span> Business purpose of travel</li>
                <li className="flex items-start gap-2"><span className="text-samsung-blue">•</span> Knox Approval (if applicable)</li>
                <li className="flex items-start gap-2"><span className="text-samsung-blue">•</span> Travel Insurance (international)</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'internet' && (
          <form onSubmit={handleInternetSubmit}>
            <div className="flex flex-col gap-6 mb-8 max-w-lg">
              <FormField id="month" label="Claim Month (YYYY-MM)" type="text" placeholder="e.g. 2024-05" value={internetData.month} onChange={e => setInternetData({...internetData, month: e.target.value})} required />
              <FormField id="noOfMonths" label="Number of Months" type="number" min="1" value={internetData.noOfMonths} onChange={e => setInternetData({...internetData, noOfMonths: e.target.value})} required />
              <FormField id="amount" label="Bill Amount" type="number" value={internetData.amount} onChange={e => setInternetData({...internetData, amount: e.target.value})} required />
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="isSelfDeclared"
                  className="rounded border-gray-300 text-samsung-blue focus:ring-samsung-blue"
                  checked={internetData.isSelfDeclared}
                  onChange={e => setInternetData({...internetData, isSelfDeclared: e.target.checked})}
                />
                <label htmlFor="isSelfDeclared" className="text-sm font-medium text-gray-700">This bill is not in my name</label>
              </div>

              {internetData.isSelfDeclared && (
                <FormField 
                  id="declarationText" 
                  label="Name on Bill and Relationship" 
                  type="text" 
                  value={internetData.declarationText} 
                  onChange={e => setInternetData({...internetData, declarationText: e.target.value})} 
                  required 
                />
              )}
              
              <UploadZone id="internetBill" label="Upload Internet Bill" accept=".pdf,.png,.jpg" required />
            </div>
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <button type="submit" disabled={loading} className="bg-samsung-blue text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'carpool' && (
          <form onSubmit={handleCarpoolSubmit}>
            <div className="flex flex-col gap-6 mb-8 max-w-lg">
              <Select id="vehicleType" label="Vehicle Type" options={[{label: 'Own Vehicle', value: 'own'}, {label: 'Rented / Cab', value: 'rented'}]} value={carpoolData.vehicleType} onChange={e => setCarpoolData({...carpoolData, vehicleType: e.target.value})} />
              <Select id="claimType" label="Claim Route" options={[{label: 'One Way', value: 'one_way'}, {label: 'Both Ways', value: 'both_way'}]} value={carpoolData.claimType} onChange={e => setCarpoolData({...carpoolData, claimType: e.target.value})} />
              
              {carpoolData.vehicleType === 'own' ? (
                <>
                  <FormField id="distance" label="Distance (km, home to office)" type="number" value={carpoolData.distance} onChange={e => setCarpoolData({...carpoolData, distance: e.target.value})} required />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="carpoolConfirm" className="rounded border-gray-300 text-samsung-blue focus:ring-samsung-blue" checked={carpoolData.confirmation} onChange={e => setCarpoolData({...carpoolData, confirmation: e.target.checked})} />
                    <label htmlFor="carpoolConfirm" className="text-sm font-medium text-gray-700">I confirm I have valid insurance and am driving a 4-wheeler</label>
                  </div>
                </>
              ) : (
                <>
                  <FormField id="amount" label="Bill Amount" type="number" value={carpoolData.amount} onChange={e => setCarpoolData({...carpoolData, amount: e.target.value})} required />
                  <UploadZone id="cabBill" label="Upload Cab Bill" accept=".pdf,.png,.jpg" required />
                </>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <button type="submit" disabled={loading} className="bg-samsung-blue text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'relocation' && (
          <form onSubmit={handleRelocationSubmit}>
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
                    <FormField id={`amount-${idx}`} label="Claimed Amount" type="number" value={item.claimedAmount} onChange={e => {
                      const newItems = [...relocationItems];
                      newItems[idx].claimedAmount = e.target.value;
                      setRelocationItems(newItems);
                    }} required />
                  </div>
                  {idx > 0 && (
                    <button type="button" onClick={() => setRelocationItems(relocationItems.filter((_, i) => i !== idx))} className="px-3 py-2 border border-red-200 text-status-rejected bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium">
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setRelocationItems([...relocationItems, { component: 'Accommodation', claimedAmount: '' }])} className="w-max px-4 py-2 border border-border text-gray-700 bg-white hover:bg-gray-50 rounded-md text-sm font-medium flex items-center gap-1">
                + Add Component
              </button>
              
              <UploadZone id="relocationProofs" label="Upload Proofs" accept=".pdf,.png,.jpg" multiple required />
            </div>
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <button type="submit" disabled={loading} className="bg-samsung-blue text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
