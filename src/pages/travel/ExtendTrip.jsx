import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequestById, extendTrip } from '../../services/requests';
import FormField from '../../components/shared/FormField';
import UploadZone from '../../components/shared/UploadZone';
import Toast from '../../components/shared/Toast';
import { Info, HelpCircle } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export default function ExtendTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [revisedEndDate, setRevisedEndDate] = useState('');
  const [revisedApprovalDoc, setRevisedApprovalDoc] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getRequestById(id);
        setRequest(data);
        if (data?.dates?.endDate) {
          setRevisedEndDate(data.dates.endDate);
        }
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
    if (revisedApprovalDoc.length === 0) {
      setToast({ visible: true, message: 'Please upload the revised Knox approval document.', type: 'error' });
      return;
    }
    
    setSubmitting(true);
    try {
      await extendTrip(id, {
        revisedEndDate,
        approvalDocument: revisedApprovalDoc
      });
      setToast({ visible: true, message: 'Trip extended successfully', type: 'success' });
      setTimeout(() => navigate(`/requests/${id}`), 1500);
    } catch (err) {
      setToast({ visible: true, message: 'Failed to submit trip extension.', type: 'error' });
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading request details...</div>;
  if (!request) return <div className="p-6">Request not found.</div>;

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
      <button 
        onClick={() => navigate(`/requests/${id}`)}
        className="text-samsung-blue text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer w-max focus:outline-none"
      >
        ← Back to Request Details
      </button>
      
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Extend Business Trip</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">Request ID: {request.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-lg shadow-sm border-t-4 border-samsung-blue border-l border-r border-b border-border">
          <div className="px-6 md:px-8 py-5 border-b border-border flex justify-between items-center bg-gray-50/50">
            <h2 className="text-base font-semibold text-gray-900 m-0">Extension Details</h2>
            <span className="text-xs font-mono uppercase tracking-wide text-gray-400">Draft auto-saved</span>
          </div>

          <div className="p-6 md:p-8 max-w-4xl">
            <div className="bg-gray-50 text-gray-700 p-4 rounded-md text-sm mb-6 border border-border flex justify-between items-center">
              <span><strong className="text-gray-900">Current End Date:</strong> {formatDate(request.dates?.endDate)}</span>
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wide">{request.destination}</span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-xl">
              <FormField 
                id="revisedEndDate" 
                label="Revised End Date" 
                type="date" 
                value={revisedEndDate}
                onChange={e => setRevisedEndDate(e.target.value)}
                min={request.dates?.endDate}
                required
              />

              <div className="mt-2">
                <UploadZone 
                  id="revisedApprovalDoc"
                  label="Revised Knox Approval (PDF/Image)"
                  accept=".pdf,.png,.jpg"
                  files={revisedApprovalDoc}
                  onFilesChange={setRevisedApprovalDoc}
                  required
                />
              </div>

              <div className="mt-4 pt-6 border-t border-border flex justify-between items-center">
                <button type="button" onClick={() => navigate(`/requests/${id}`)} className="text-gray-600 hover:text-gray-900 font-medium text-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed">
                  {submitting ? 'Submitting...' : 'Submit Extension Request'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Contextual Info */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 sticky top-6">
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900">
              <Info size={18} className="text-samsung-blue" /> Extension Guidelines
            </h3>
            
            <ul className="pl-5 list-disc text-gray-600 text-sm flex flex-col gap-3 mb-6 marker:text-samsung-blue">
              <li>Trips can only be extended if settlement has not yet been processed.</li>
              <li>You must attach a newly approved Knox document reflecting the extended dates.</li>
              <li>Per diem will automatically recalculate during settlement to account for the extra days.</li>
            </ul>

            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2 text-gray-900 border-t border-gray-100 pt-4">
              <HelpCircle size={16} className="text-gray-400" /> FAQ
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800 mb-0.5">Do I need to redo my pre-approval?</p>
                <p className="text-xs text-gray-600">No, this extension automatically updates your active pre-approval record.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
