import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequestById } from '../../services/requests';
import Badge from '../../components/shared/Badge';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { hasEndDatePassed } from '../../utils/dateHelpers';
import FilePreviewModal from '../../components/shared/FilePreviewModal';

export default function ViewRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

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
                              hasEndDatePassed(request.dates?.endDate || request.endDate);

  const canExtendTrip = request.type === 'travel' && 
                        request.stage === 'pre-approval' && 
                        request.preApprovalStatus === 'approved' && 
                        !request.settlement;

  const getStatusBadge = () => {
    let status = 'pending';
    if (request.stage === 'pre-approval' && request.preApprovalStatus === 'approved') status = 'approved';
    if (request.stage === 'pre-approval' && request.preApprovalStatus === 'rejected') status = 'rejected';
    if (request.stage === 'settlement' && request.settlementStatus === 'approved') status = 'approved';
    if (request.stage === 'settlement' && request.settlementStatus === 'rejected') status = 'rejected';
    return <Badge status={status}>{request.stage === 'pre-approval' ? 'Pre-Approval ' + request.preApprovalStatus : 'Settlement ' + request.settlementStatus}</Badge>;
  };

  const renderDocLink = (docArray) => {
    if (!docArray || !docArray.length) return <span className="text-gray-500">Not uploaded</span>;
    const file = docArray[0];
    return (
      <button
        onClick={() => setPreviewFile(file)}
        className="text-samsung-blue hover:underline focus:outline-none bg-transparent border-none p-0 cursor-pointer"
        title="Preview Document"
      >
        {file.name}
      </button>
    );
  };

  return (
    <div className="p-6 w-full max-w-none mx-auto flex flex-col gap-6">
      <button 
        onClick={() => navigate('/requests')}
        className="text-samsung-blue text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer w-max focus:outline-none"
      >
        ← Back to My Requests
      </button>

      <div className="pb-4 border-b border-border dark:border-slate-700 bg-gradient-to-b from-blue-50/30 dark:from-slate-800/50 to-transparent -mx-6 px-6 pt-2 mb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Request
          </h1>
          <p className="text-sm font-mono tracking-wide uppercase text-gray-500 dark:text-slate-400 mt-1">Submitted on {formatDate(request.submittedAt)}</p>
        </div>
        <div className="pb-1">
          {getStatusBadge()}
        </div>
      </div>

      {request.financeNote && (
        <div className="bg-gray-100 dark:bg-slate-800/50 p-4 rounded-md border-l-4 border-gray-400 dark:border-slate-500 mb-2">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1">Note from Finance:</h4>
          <p className="m-0 text-sm text-gray-700 dark:text-slate-300">{request.financeNote}</p>
        </div>
      )}

      {/* TIMELINE (Travel Only) */}
      {request.type === 'travel' && (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-sm border border-border dark:border-slate-700">
          <h3 className="text-lg font-serif font-medium text-gray-900 dark:text-gray-100 border-b border-border dark:border-slate-700 pb-2 mb-4">Request Timeline</h3>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="w-4 flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-samsung-blue dark:bg-blue-500"></div>
                <div className="w-0.5 h-full bg-gray-200 dark:bg-slate-600"></div>
              </div>
              <div className="pb-4">
                <div className="font-medium text-gray-900 dark:text-gray-100">Pre-Approval Submitted</div>
                <div className="text-sm text-gray-500 dark:text-slate-400">{formatDate(request.submittedAt)}</div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-4 flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${request.preApprovalStatus === 'approved' ? 'bg-status-approved' : request.preApprovalStatus === 'rejected' ? 'bg-status-rejected' : 'bg-status-pending'}`}></div>
                <div className="w-0.5 h-full bg-gray-200 dark:bg-slate-600"></div>
              </div>
              <div className="pb-4">
                <div className="font-medium text-gray-900 dark:text-gray-100">Pre-Approval Review</div>
                <div className="text-sm text-gray-500 dark:text-slate-400">{request.preApprovalStatus === 'approved' ? 'Approved' : request.preApprovalStatus === 'rejected' ? 'Rejected' : 'Pending Finance Review'}</div>
              </div>
            </div>

            {request.preApprovalStatus === 'approved' && (
              <>
                <div className="flex gap-4">
                  <div className="w-4 flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${request.stage === 'settlement' ? 'bg-samsung-blue dark:bg-blue-500' : 'bg-gray-300 dark:bg-slate-500'}`}></div>
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-slate-600"></div>
                  </div>
                  <div className="pb-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">Settlement Submitted</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">{request.stage === 'settlement' ? 'Completed' : 'Not submitted yet'}</div>
                  </div>
                </div>

                {request.stage === 'settlement' && (
                  <div className="flex gap-4">
                    <div className="w-4 flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${request.settlementStatus === 'approved' ? 'bg-status-approved' : request.settlementStatus === 'rejected' ? 'bg-status-rejected' : 'bg-status-pending'}`}></div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Settlement Review</div>
                      <div className="text-sm text-gray-500 dark:text-slate-400">{request.settlementStatus === 'approved' ? 'Approved' : request.settlementStatus === 'rejected' ? 'Rejected' : 'Pending Finance Review'}</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-sm border border-border dark:border-slate-700">
        
        {/* Travel Details */}
        {request.type === 'travel' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-serif font-medium text-gray-900 dark:text-gray-100 border-b border-border dark:border-slate-700 pb-2 mb-2">Travel Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-slate-300">
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">Type:</strong> <span className="capitalize">{request.subtype}</span></div>
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">Destination:</strong> {request.destination}</div>
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">Start Date:</strong> {formatDate(request.dates?.startDate || request.startDate)}</div>
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">End Date:</strong> {formatDate(request.dates?.endDate || request.endDate)}</div>
            </div>
            <div className="mt-2">
              <strong className="text-sm font-medium text-gray-900 dark:text-gray-100">Purpose:</strong>
              <p className="mt-2 bg-gray-50 dark:bg-slate-700/50 p-4 rounded-md text-sm text-gray-700 dark:text-slate-300 border border-border dark:border-slate-600">{request.purpose}</p>
            </div>
            
            {/* Travel Documents (from Pre-Approval) */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-border dark:border-slate-700 pb-2 mb-4">Pre-Approval Documents</h3>
              <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-slate-300">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-2 rounded-md border border-gray-100 dark:border-slate-600">
                  <span className="font-medium">Knox Approval</span>
                  {renderDocLink(request.documents?.preApproval?.knoxApproval)}
                </div>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-2 rounded-md border border-gray-100 dark:border-slate-600">
                  <span className="font-medium">Travel Insurance</span>
                  {renderDocLink(request.documents?.preApproval?.travelInsurance)}
                </div>
                {request.subtype === 'international' && (
                  <>
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-2 rounded-md border border-gray-100 dark:border-slate-600">
                      <span className="font-medium">Visa</span>
                      {renderDocLink(request.documents?.preApproval?.visa)}
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-2 rounded-md border border-gray-100 dark:border-slate-600">
                      <span className="font-medium">Passport</span>
                      {renderDocLink(request.documents?.preApproval?.passport)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {request.stage === 'settlement' && request.settlement && (
              <div className="mt-8">
                <h3 className="text-lg font-serif font-medium text-gray-900 dark:text-gray-100 border-b border-border dark:border-slate-700 pb-2 mb-4">Settlement Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-slate-300">
                  <div><strong className="font-medium text-gray-900 dark:text-gray-100">Per Diem ({request.settlement.perDiemDays} days):</strong> <span className="font-mono">{formatCurrency(request.settlement.perDiemTotal, request.settlement.currency)}</span></div>
                  <div><strong className="font-medium text-gray-900 dark:text-gray-100">Hotel ({request.settlement.hotelName || 'Actuals'}):</strong> <span className="font-mono">{formatCurrency(request.settlement.hotelActual, request.settlement.currency)}</span></div>
                  <div><strong className="font-medium text-gray-900 dark:text-gray-100">Flight:</strong> <span className="font-mono">{formatCurrency(request.settlement.flightActual, request.settlement.currency)}</span></div>
                  <div><strong className="font-medium text-gray-900 dark:text-gray-100">Conveyance:</strong> <span className="font-mono">{formatCurrency(request.settlement.conveyanceActual, request.settlement.currency)}</span></div>
                  {request.subtype === 'international' && request.settlement.winterClothesActual > 0 && (
                    <div><strong className="font-medium text-gray-900 dark:text-gray-100">Winter Clothes:</strong> <span className="font-mono">{formatCurrency(request.settlement.winterClothesActual, request.settlement.currency)}</span></div>
                  )}
                  <div className="sm:col-span-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <strong className="font-medium text-gray-900 dark:text-gray-100 text-base">Total Reimbursable</strong>
                    <span className="font-mono text-lg font-bold text-samsung-blue dark:text-blue-400">{formatCurrency(request.settlement.totalReimbursable, request.settlement.currency)}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-border dark:border-slate-700 pb-2 mb-4">Settlement Documents</h3>
                  <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-slate-300">
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-700/50 p-2 rounded-md border border-gray-100 dark:border-slate-600">
                      <span className="font-medium">Receipts (Hotel, Flight, Conveyance)</span>
                      <span className="text-gray-500 dark:text-slate-400">{request.documents?.settlement?.length ? `${request.documents.settlement.length} file(s)` : 'Not uploaded'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Internet Details */}
        {request.type === 'internet-bill' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-serif font-medium text-gray-900 dark:text-gray-100 border-b border-border dark:border-slate-700 pb-2 mb-2">Internet Bill Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-slate-300">
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">Provider:</strong> {request.settlement?.provider}</div>
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">Frequency:</strong> <span className="capitalize">{request.settlement?.frequency}</span></div>
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">Total Billed:</strong> <span className="font-mono">{formatCurrency(request.settlement?.totalActual || 0)}</span></div>
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">Reimbursable:</strong> <span className="font-mono text-samsung-blue dark:text-blue-400 font-semibold">{formatCurrency(request.settlement?.totalReimbursable || 0)}</span></div>
            </div>
            {request.settlement?.periods && request.settlement.periods.length > 0 && (
              <div className="mt-2">
                <strong className="text-sm font-medium text-gray-900 dark:text-gray-100">Billing Periods:</strong>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 dark:text-slate-300">
                  {request.settlement.periods.map((p, i) => (
                    <li key={i}>{p.label}: <span className="font-mono">{formatCurrency(p.amount)}</span></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Carpool Details */}
        {request.type === 'carpool' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-serif font-medium text-gray-900 dark:text-gray-100 border-b border-border dark:border-slate-700 pb-2 mb-2">Carpool Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-slate-300">
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">Vehicle Number:</strong> {request.settlement?.vehicleNumber}</div>
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">Total Members:</strong> {request.settlement?.members}</div>
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">Monthly Amount:</strong> <span className="font-mono text-samsung-blue dark:text-blue-400 font-semibold">{formatCurrency(request.settlement?.monthlyAmount || 0)}</span></div>
            </div>
          </div>
        )}

        {/* Relocation Details */}
        {request.type === 'relocation' && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-serif font-medium text-gray-900 dark:text-gray-100 border-b border-border dark:border-slate-700 pb-2 mb-2">Relocation Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-slate-300 mb-2">
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">From City:</strong> {request.settlement?.fromCity}</div>
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">To City:</strong> {request.settlement?.toCity}</div>
              <div><strong className="font-medium text-gray-900 dark:text-gray-100">Total Claimed:</strong> <span className="font-mono text-samsung-blue dark:text-blue-400 font-semibold">{formatCurrency(request.settlement?.totalReimbursable || 0)}</span></div>
            </div>
            <table className="w-full border-collapse mt-2">
              <thead>
                <tr className="border-b-2 border-gray-100 dark:border-slate-700 text-left text-xs font-mono uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  <th className="pb-2">Component</th>
                  <th className="pb-2">Claimed</th>
                </tr>
              </thead>
              <tbody>
                {request.settlement?.components?.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <td className="py-3 text-sm text-gray-700 dark:text-slate-300 capitalize">{item.category}</td>
                    <td className="py-3 text-sm font-mono font-medium text-gray-900 dark:text-gray-100">{formatCurrency(item.actual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {(canSubmitSettlement || canExtendTrip) && (
        <div className="mt-6 flex justify-end gap-4">
          {canExtendTrip && (
            <button 
              onClick={() => navigate(`/new-request/travel/extend/${id}`)}
              className="bg-white text-gray-700 border border-border px-6 py-2.5 rounded-md font-medium text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              Extend Trip
            </button>
          )}
          {canSubmitSettlement && (
            <button 
              onClick={() => navigate(`/requests/${id}/settlement`)}
              className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue"
            >
              Submit Settlement
            </button>
          )}
        </div>
      )}

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
