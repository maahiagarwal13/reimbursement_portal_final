import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequestById, financeReview } from '../../services/requests';
import Badge from '../../components/shared/Badge';
import FormField from '../../components/shared/FormField';
import Toast from '../../components/shared/Toast';
import { formatDate, formatCurrency } from '../../utils/formatters';

export default function FinanceReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [note, setNote] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadRequest() {
      try {
        const data = await getRequestById(id);
        setRequest(data);
        if (data.financeNote) setNote(data.financeNote);
      } catch (err) {
        console.error("Failed to load request", err);
      } finally {
        setLoading(false);
      }
    }
    loadRequest();
  }, [id]);

  if (loading) return <div className="p-6">Loading review...</div>;
  if (!request) return <div className="p-6">Request not found.</div>;

  const needsReview = 
    (request.stage === 'pre-approval' && request.preApprovalStatus === 'pending') ||
    (request.stage === 'settlement' && request.settlementStatus === 'pending') ||
    (!['travel'].includes(request.type) && request.settlementStatus === 'pending');

  const handleReview = async (action) => {
    setSubmitting(true);
    try {
      await financeReview(id, { action, financeNote: note });
      setToast({ visible: true, message: `Request ${action}d successfully`, type: 'success' });
      setTimeout(() => navigate('/finance/requests'), 1500);
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    let status = 'pending';
    if (request.stage === 'pre-approval' && request.preApprovalStatus === 'approved') status = 'approved';
    if (request.stage === 'pre-approval' && request.preApprovalStatus === 'rejected') status = 'rejected';
    if (request.stage === 'settlement' && request.settlementStatus === 'approved') status = 'approved';
    if (request.stage === 'settlement' && request.settlementStatus === 'rejected') status = 'rejected';
    return <Badge status={status}>{request.stage === 'pre-approval' ? 'Pre-Approval ' + request.preApprovalStatus : 'Settlement ' + request.settlementStatus}</Badge>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <button 
        onClick={() => navigate('/finance/requests')}
        className="text-samsung-blue text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer w-max focus:outline-none"
      >
        ← Back to All Requests
      </button>

      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">Review Request</h1>
          <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">GHR ID: {request.ghrId} | Submitted: {formatDate(request.submittedAt)}</p>
        </div>
        <div className="pb-1">
          {getStatusBadge()}
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border">
        {/* Render read-only details based on type (similar to ViewRequest) */}
        <h3 className="text-lg font-serif font-medium text-gray-900 border-b border-border pb-2 mb-4">Request Details ({request.type})</h3>
        
        {request.type === 'travel' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div><strong className="font-medium text-gray-900">Type:</strong> {request.subtype}</div>
            <div><strong className="font-medium text-gray-900">Destination:</strong> {request.destination}</div>
            <div><strong className="font-medium text-gray-900">Dates:</strong> {formatDate(request.startDate)} to {formatDate(request.endDate)}</div>
            <div className="sm:col-span-2"><strong className="font-medium text-gray-900">Purpose:</strong> <span className="block mt-1 p-3 bg-gray-50 border border-border rounded-md">{request.purpose}</span></div>
          </div>
        )}

        {request.type === 'travel' && request.stage === 'settlement' && request.settlement && (
          <div className="mt-8 bg-gray-50 p-6 rounded-md border border-border">
            <h4 className="font-semibold text-gray-900 mb-3">Settlement Claim</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div><strong className="font-medium text-gray-900">Per Diem:</strong> <span className="font-mono">{formatCurrency(request.settlement.perDiemTotal)}</span></div>
              <div><strong className="font-medium text-gray-900">Hotel Claimed:</strong> <span className="font-mono">{formatCurrency(request.settlement.hotelClaimed)}</span></div>
              <div><strong className="font-medium text-gray-900">Flight:</strong> <span className="font-mono">{formatCurrency(request.settlement.flightCost)}</span></div>
              <div><strong className="font-medium text-gray-900">Conveyance:</strong> <span className="font-mono">{formatCurrency(request.settlement.conveyance)}</span></div>
            </div>
          </div>
        )}

        {request.type === 'internet' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <div><strong className="font-medium text-gray-900">Month:</strong> {request.month}</div>
            <div><strong className="font-medium text-gray-900">Amount:</strong> <span className="font-mono">{formatCurrency(request.amount)}</span></div>
            <div><strong className="font-medium text-gray-900">Self Declared:</strong> {request.isSelfDeclared ? 'Yes' : 'No'}</div>
            {request.isSelfDeclared && <div className="sm:col-span-2"><strong className="font-medium text-gray-900">Declaration:</strong> <span className="block mt-1 p-3 bg-gray-50 border border-border rounded-md">{request.declarationText}</span></div>}
          </div>
        )}
      </div>

      {needsReview && (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border">
          <h3 className="text-lg font-serif font-medium text-gray-900 border-b border-border pb-2 mb-4">Review Action</h3>
          
          <FormField 
            id="financeNote" 
            label="Finance Note (Optional for approval, required for rejection)" 
            type="textarea" 
            value={note} 
            onChange={e => setNote(e.target.value)} 
          />

          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => handleReview('approve')}
              disabled={submitting}
              className="flex-1 py-3 px-6 bg-status-approved text-white rounded-md font-medium text-sm hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-status-approved disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Approve
            </button>
            <button 
              onClick={() => handleReview('reject')}
              disabled={submitting || !note.trim()}
              className="flex-1 py-3 px-6 bg-status-rejected text-white rounded-md font-medium text-sm hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-status-rejected disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
