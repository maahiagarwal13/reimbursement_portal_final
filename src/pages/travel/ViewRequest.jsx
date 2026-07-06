import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequestById } from '../../services/requests';
import Badge from '../../components/shared/Badge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { hasEndDatePassed } from '../../utils/dateHelpers';

export default function ViewRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequest() {
      try {
        const data = await getRequestById(id);
        setRequest(data);
      } catch (err) {
        console.error("Failed to load request", err);
      } finally {
        setLoading(false);
      }
    }
    loadRequest();
  }, [id]);

  if (loading) return <div className="p-6">Loading request details...</div>;
  if (!request) return <div className="p-6">Request not found.</div>;

  const canSubmitSettlement = request.type === 'travel' && 
                              request.stage === 'pre-approval' && 
                              request.preApprovalStatus === 'approved' && 
                              hasEndDatePassed(request.endDate);

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
        onClick={() => navigate('/employee/requests')}
        className="text-samsung-blue text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer w-max focus:outline-none"
      >
        ← Back to My Requests
      </button>

      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">
            {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Request
          </h1>
          <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">Submitted on {formatDate(request.submittedAt)}</p>
        </div>
        <div className="pb-1">
          {getStatusBadge()}
        </div>
      </div>

      {request.financeNote && (
        <div className="bg-gray-100 p-4 rounded-md border-l-4 border-gray-400 mb-2">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Note from Finance:</h4>
          <p className="m-0 text-sm text-gray-700">{request.financeNote}</p>
        </div>
      )}

      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border">
        
        {/* Travel Details */}
        {request.type === 'travel' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-serif font-medium text-gray-900 border-b border-border pb-2 mb-2">Travel Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div><strong className="font-medium text-gray-900">Type:</strong> {request.subtype}</div>
              <div><strong className="font-medium text-gray-900">Destination:</strong> {request.destination}</div>
              <div><strong className="font-medium text-gray-900">Start Date:</strong> {formatDate(request.startDate)}</div>
              <div><strong className="font-medium text-gray-900">End Date:</strong> {formatDate(request.endDate)}</div>
            </div>
            <div className="mt-2">
              <strong className="text-sm font-medium text-gray-900">Purpose:</strong>
              <p className="mt-2 bg-gray-50 p-4 rounded-md text-sm text-gray-700 border border-border">{request.purpose}</p>
            </div>
            
            {request.stage === 'settlement' && request.settlement && (
              <div className="mt-8">
                <h3 className="text-lg font-serif font-medium text-gray-900 border-b border-border pb-2 mb-4">Settlement Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div><strong className="font-medium text-gray-900">Per Diem:</strong> <span className="font-mono">{formatCurrency(request.settlement.perDiemTotal, request.subtype === 'domestic' ? 'INR' : (request.tier === 'Japan' ? 'JPY' : 'USD'))}</span></div>
                  <div><strong className="font-medium text-gray-900">Hotel Claimed:</strong> <span className="font-mono">{formatCurrency(request.settlement.hotelClaimed, request.subtype === 'domestic' ? 'INR' : (request.tier === 'Japan' ? 'JPY' : 'USD'))}</span></div>
                  <div><strong className="font-medium text-gray-900">Flight:</strong> <span className="font-mono">{formatCurrency(request.settlement.flightCost, request.subtype === 'domestic' ? 'INR' : (request.tier === 'Japan' ? 'JPY' : 'USD'))}</span></div>
                  <div><strong className="font-medium text-gray-900">Conveyance:</strong> <span className="font-mono">{formatCurrency(request.settlement.conveyance, request.subtype === 'domestic' ? 'INR' : (request.tier === 'Japan' ? 'JPY' : 'USD'))}</span></div>
                  <div className="sm:col-span-2 mt-2">
                    {request.settlement.hotelCapApplied && <span className="text-xs text-status-pending font-medium">* Hotel cost was capped according to policy limits.</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Internet Details */}
        {request.type === 'internet' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-serif font-medium text-gray-900 border-b border-border pb-2 mb-2">Internet Bill Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div><strong className="font-medium text-gray-900">Month:</strong> {request.month || 'N/A'}</div>
              <div><strong className="font-medium text-gray-900">Amount:</strong> <span className="font-mono">{formatCurrency(request.amount || 0)}</span></div>
              <div><strong className="font-medium text-gray-900">Self Declared:</strong> {request.isSelfDeclared ? 'Yes' : 'No'}</div>
              {request.isSelfDeclared && <div><strong className="font-medium text-gray-900">Declaration:</strong> {request.declarationText}</div>}
            </div>
          </div>
        )}

        {/* Carpool Details */}
        {request.type === 'carpool' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-serif font-medium text-gray-900 border-b border-border pb-2 mb-2">Carpool Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <div><strong className="font-medium text-gray-900">Vehicle Type:</strong> {request.vehicleType}</div>
              <div><strong className="font-medium text-gray-900">Claim Type:</strong> {request.claimType.replace('_', ' ')}</div>
              {request.vehicleType === 'own' ? (
                <>
                  <div><strong className="font-medium text-gray-900">Distance:</strong> {request.distance} km</div>
                  <div><strong className="font-medium text-gray-900">Computed Cost:</strong> <span className="font-mono">{formatCurrency(request.amount || 0)}</span></div>
                </>
              ) : (
                <div><strong className="font-medium text-gray-900">Bill Amount:</strong> <span className="font-mono">{formatCurrency(request.amount || 0)}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Relocation Details */}
        {request.type === 'relocation' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-serif font-medium text-gray-900 border-b border-border pb-2 mb-2">Relocation Details</h3>
            <table className="w-full border-collapse mt-2">
              <thead>
                <tr className="border-b-2 border-gray-100 text-left text-xs font-mono uppercase tracking-wide text-gray-500">
                  <th className="pb-2">Component</th>
                  <th className="pb-2">Claimed</th>
                </tr>
              </thead>
              <tbody>
                {request.relocationLineItems?.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 text-sm text-gray-700">{item.component}</td>
                    <td className="py-3 text-sm font-mono font-medium text-gray-900">{formatCurrency(item.claimedAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {canSubmitSettlement && (
        <div className="mt-6 flex justify-end">
          <button 
            onClick={() => navigate(`/employee/requests/${id}/settlement`)}
            className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue"
          >
            Submit Settlement
          </button>
        </div>
      )}
    </div>
  );
}
