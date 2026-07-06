import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequestById, submitSettlement } from '../../services/requests';
import FormField from '../../components/shared/FormField';
import UploadZone from '../../components/shared/UploadZone';
import Toast from '../../components/shared/Toast';
import { formatDate } from '../../utils/formatters';

export default function Settlement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [flightCost, setFlightCost] = useState('');
  const [hotelCost, setHotelCost] = useState('');
  const [conveyance, setConveyance] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getRequestById(id);
        setRequest(data);
      } catch (err) {
        setToast({ visible: true, message: 'Failed to load request', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitSettlement(id, {
        flightCost: Number(flightCost) || 0,
        hotelCost: Number(hotelCost) || 0,
        conveyance: Number(conveyance) || 0
      });
      setToast({ visible: true, message: 'Settlement submitted successfully', type: 'success' });
      setTimeout(() => navigate(`/employee/requests/${id}`), 1500);
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading settlement...</div>;
  if (!request) return <div className="p-6">Request not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <button 
        onClick={() => navigate(`/employee/requests/${id}`)}
        className="text-samsung-blue text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer w-max focus:outline-none"
      >
        ← Back to Request Details
      </button>
      
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Submit Settlement</h1>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border border-border mb-4">
        <h3 className="text-sm font-semibold mb-4 text-gray-900">Pre-Approval Details (Read-only)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <div><strong className="text-gray-900 font-medium">Destination:</strong> {request.destination}</div>
          <div><strong className="text-gray-900 font-medium">Type:</strong> {request.subtype}</div>
          <div><strong className="text-gray-900 font-medium">Start Date:</strong> {formatDate(request.startDate)}</div>
          <div><strong className="text-gray-900 font-medium">End Date:</strong> {formatDate(request.endDate)}</div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6 max-w-lg">
            
            {request.subtype === 'domestic' && (
              <FormField id="flightCost" label="Flight Cost (Actuals)" type="number" value={flightCost} onChange={e => setFlightCost(e.target.value)} required />
            )}
            
            <FormField id="hotelCost" label="Hotel Bill Amount" type="number" value={hotelCost} onChange={e => setHotelCost(e.target.value)} required />
            
            <FormField id="conveyance" label={request.subtype === 'international' ? "Total Local Conveyance (Full Stay)" : "Local Conveyance"} type="number" value={conveyance} onChange={e => setConveyance(e.target.value)} required />

            <div className="mt-2">
              <UploadZone id="receipts" label="Upload All Receipts (Boarding Pass, Hotel Bill, Conveyance)" accept=".pdf,.png,.jpg" multiple required />
            </div>

          </div>
          
          <div className="mt-8 pt-6 border-t border-border flex justify-between items-start gap-4">
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              * Per diem and hotel caps will be computed automatically by the system based on your CL and destination.
            </p>
            <button type="submit" disabled={submitting} className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed">
              {submitting ? 'Submitting...' : 'Submit Settlement'}
            </button>
          </div>
        </form>
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
