import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequestById, financeReview } from '../../services/requests';
import { getRateConfig, getIntlCountryTiers } from '../../services/rateConfig';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/shared/Badge';
import Toast from '../../components/shared/Toast';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Info, CheckCircle, Clock, FileText, Check, AlertCircle, Eye } from 'lucide-react';

// ─── Helper: compute a human-readable stage label ────────────────────────────
function getStageLabel(request) {
  if (request.type === 'travel') {
    if (request.stage === 'pre-approval') return 'Pre-Approval Review';
    if (request.stage === 'settlement') return 'Settlement Review';
    return 'Review';
  }
  if (request.type === 'internet-bill') return 'Internet Bill Review';
  if (request.type === 'carpool') return 'Carpool Review';
  if (request.type === 'relocation') return 'Relocation Review';
  return 'Review';
}

// ─── Helper: format a friendly type name ─────────────────────────────────────
function typeLabel(type) {
  const map = {
    'travel': 'Business Travel',
    'internet-bill': 'Internet Bill',
    'carpool': 'Carpool',
    'relocation': 'Relocation',
  };
  return map[type] || type;
}

export default function FinanceReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [policyRates, setPolicyRates] = useState(null);

  const [note, setNote] = useState('');
  const [noteErr, setNoteErr] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // 'approve' | 'reject' | 'more_info'

  useEffect(() => {
    async function loadRequest() {
      try {
        const data = await getRequestById(id);
        setRequest(data);
        if (data.financeNote) setNote(data.financeNote);

        // Load policy limit for context
        if (data.type === 'travel') {
          const cl = user.clLevel || 'CL3';
          if (data.subtype === 'domestic') {
            const perDiem = await getRateConfig('domesticPerDiem');
            const pd = cl === 'CL3' ? perDiem?.rates?.['CL3']?.['under5'] : perDiem?.rates?.[cl];
            setPolicyRates({ perDiem: pd?.value || 0, currency: 'INR' });
          } else {
            const intlPerDiem = await getRateConfig('intlPerDiem');
            const pdRates = intlPerDiem?.rates?.[cl] || intlPerDiem?.rates?.['CL3'] || [];
            if (data.destination === 'Japan') setPolicyRates({ perDiem: 8000, currency: 'JPY' });
            else {
              const countries = await getIntlCountryTiers();
              const country = countries.find(c => c.countryOrCity === data.destination);
              const tierIndex = country?.tier === 'A' ? 0 : (country?.tier === 'B' ? 1 : 2);
              setPolicyRates({ perDiem: pdRates[tierIndex] || 0, currency: 'USD' });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load request', err);
      } finally {
        setLoading(false);
      }
    }
    loadRequest();
  }, [id, user]);

  if (loading) return <div className="p-6">Loading review...</div>;
  if (!request) return <div className="p-6">Request not found.</div>;

  // ── Determine the pending state (mirrors reference project logic) ──────────
  const isTravel = request.type === 'travel';
  const isPreApprovalPending = isTravel && request.stage === 'pre-approval' && request.preApprovalStatus === 'pending';
  const isSettlementPending  = isTravel && request.stage === 'settlement'   && request.settlementStatus === 'pending';
  const isOtherPending       = !isTravel && request.settlementStatus === 'pending';

  const canAction = isPreApprovalPending || isSettlementPending || isOtherPending;

  // ── Handle approve / reject ───────────────────────────────────────────────
  const handleAction = async (action) => {
    if (action === 'reject' && !note.trim()) {
      setNoteErr(true);
      return;
    }
    setNoteErr(false);
    setSubmitting(true);
    try {
      await financeReview(id, { action, financeNote: note });
      setDone(action);
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col items-center gap-6 mt-16">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${done === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}>
          {done === 'approve' ? (
            <svg className="w-8 h-8 text-status-approved" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg className="w-8 h-8 text-status-rejected" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          )}
        </div>
        <div className="text-center">
          <h2 className="font-serif text-2xl font-semibold text-gray-900 mb-2">
            Request {done === 'approve' ? 'Approved' : 'Rejected'}
          </h2>
          <p className="text-sm text-gray-500">Action saved successfully.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/finance/requests')} className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800">
            Return to Queue
          </button>
          <button onClick={() => navigate('/finance/dashboard')} className="border border-border text-gray-700 px-6 py-2.5 rounded-md font-medium text-sm hover:bg-gray-50">
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Derive current status for the badge ──────────────────────────────────
  const currentStatus = (() => {
    if (request.type === 'travel') {
      if (request.stage === 'pre-approval') return request.preApprovalStatus;
      return request.settlementStatus;
    }
    return request.settlementStatus;
  })();

  const stl = request.settlement || {};

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/finance/requests')}
        className="text-samsung-blue text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer w-max focus:outline-none"
      >
        ← Back to All Requests
      </button>

      {/* Header */}
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">{getStageLabel(request)}</h1>
          <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">
            {request.id} · {typeLabel(request.type)} · Submitted {formatDate(request.submittedAt)}
          </p>
        </div>
        <div className="pb-1">
          <Badge status={currentStatus || 'pending'}>{currentStatus || 'pending'}</Badge>
        </div>
      </div>

      {/* ── Grid Layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* ── Section 1: Employee & basic info ─────────────────────────────── */}
          <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-gray-50 flex items-center gap-2">
              <FileText size={18} className="text-samsung-blue" />
              <h3 className="text-sm font-semibold text-gray-900 m-0">Request Details</h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                <div><span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Request ID</span> <strong className="font-medium text-gray-900">{request.id}</strong></div>
                <div><span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Type</span> <strong className="font-medium text-gray-900">{typeLabel(request.type)}</strong></div>
                <div><span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">GHR ID</span> <strong className="font-medium text-gray-900">{request.ghrId}</strong></div>
                <div><span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Submitted</span> <strong className="font-medium text-gray-900">{formatDate(request.submittedAt)}</strong></div>

            {/* Travel-specific */}
            {request.type === 'travel' && (
              <>
                <div><span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Subtype</span> <strong className="font-medium text-gray-900 capitalize">{request.subtype}</strong></div>
                <div><span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Destination</span> <strong className="font-medium text-gray-900">{request.destination}</strong></div>
                <div><span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Start Date</span> <strong className="font-medium text-gray-900">{formatDate(request.dates?.startDate)}</strong></div>
                <div><span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">End Date</span> <strong className="font-medium text-gray-900">{formatDate(request.dates?.endDate)}</strong></div>
                <div className="sm:col-span-2">
                  <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Purpose</span>
                  <div className="bg-gray-50 p-3 border border-border rounded-md text-gray-800">{request.purpose}</div>
                </div>
              </>
            )}

          {/* Internet bill */}
          {request.type === 'internet-bill' && request.internetBillRequest && (
            <>
              <div><strong className="font-medium text-gray-900">Provider:</strong> {request.internetBillRequest.provider}</div>
              <div><strong className="font-medium text-gray-900">Frequency:</strong> {request.internetBillRequest.frequency}</div>
              <div><strong className="font-medium text-gray-900">Total Claimed:</strong> <span className="font-mono">{formatCurrency(request.internetBillRequest.totalAmount)}</span></div>
              <div><strong className="font-medium text-gray-900">Claimable:</strong> <span className="font-mono">{formatCurrency(request.internetBillRequest.claimableAmount)}</span></div>
            </>
          )}

          {/* Carpool */}
          {request.type === 'carpool' && stl && (
            <>
              <div><strong className="font-medium text-gray-900">Claim Month:</strong> {request.dates?.claimMonth}</div>
              <div><strong className="font-medium text-gray-900">Vehicle Type:</strong> <span className="capitalize">{stl.vehicleType}</span></div>
              <div><strong className="font-medium text-gray-900">Claim Type:</strong> {stl.claimType?.replace('_', ' ')}</div>
              <div><strong className="font-medium text-gray-900">Working Days:</strong> {request.dates?.workingDays}</div>
              {stl.vehicleType === 'own' && (
                <>
                  <div><strong className="font-medium text-gray-900">Distance (one-way):</strong> {stl.distanceOneWayKm} km</div>
                  <div><strong className="font-medium text-gray-900">Computed Cost:</strong> <span className="font-mono">{formatCurrency(stl.computedCost)}</span></div>
                </>
              )}
              <div><strong className="font-medium text-gray-900">Reimbursable:</strong> <span className="font-mono font-bold text-samsung-blue">{formatCurrency(stl.reimbursable)}</span></div>
            </>
          )}

          {/* Relocation */}
          {request.type === 'relocation' && stl?.lineItems && (
            <>
              <div><strong className="font-medium text-gray-900">Destination:</strong> {request.destination}</div>
              <div><strong className="font-medium text-gray-900">Relocation Date:</strong> {formatDate(request.dates?.relocationDate)}</div>
              <div className="sm:col-span-2">
                <strong className="font-medium text-gray-900 block mb-2">Component Breakdown:</strong>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100 text-left text-xs font-mono uppercase tracking-wide text-gray-500">
                      <th className="pb-2">Component</th>
                      <th className="pb-2 text-right">Actual</th>
                      <th className="pb-2 text-right">Cap</th>
                      <th className="pb-2 text-right">Reimbursable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stl.lineItems.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 capitalize">{item.component}</td>
                        <td className="py-2 text-right font-mono">{formatCurrency(item.actualAmount)}</td>
                        <td className="py-2 text-right font-mono text-gray-500">{formatCurrency(item.cap)}</td>
                        <td className="py-2 text-right font-mono font-medium">{formatCurrency(item.reimbursable)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan={3} className="pt-3 font-semibold text-gray-900">Total Reimbursable</td>
                      <td className="pt-3 text-right font-mono font-bold text-samsung-blue">{formatCurrency(stl.totalReimbursable)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
            </div>
          </div>

          {/* ── Section 2: Pre-approval documents ────────────────────────────── */}
          {request.type === 'travel' && request.documents?.preApproval && (
            <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-gray-50 flex items-center gap-2">
                <FileText size={18} className="text-samsung-blue" />
                <h3 className="text-sm font-semibold text-gray-900 m-0">Pre-Approval Documents</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-3 text-sm">
                  {Object.entries({
                    knoxApproval: 'Knox Approval',
                    travelInsurance: 'Travel Insurance',
                    visa: 'Visa',
                    passport: 'Passport',
                  }).map(([key, label]) => {
                    const files = request.documents.preApproval[key];
                    if (request.subtype !== 'international' && (key === 'visa' || key === 'passport')) return null;
                    return (
                      <div key={key} className="flex items-center justify-between border border-gray-200 p-4 rounded-lg bg-white shadow-sm hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${files?.length ? 'bg-status-approved' : 'bg-status-rejected'}`}></div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{label}</span>
                            <span className="text-xs text-gray-500 mt-0.5">
                              {files?.length ? files.map(f => f.name || f).join(', ') : 'Not uploaded'}
                            </span>
                          </div>
                        </div>
                        {files?.length > 0 && (
                          <button className="flex items-center gap-1.5 text-xs font-medium text-samsung-blue hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md">
                            <Eye size={14} /> View
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
            {Object.entries({
              knoxApproval: 'Knox Approval',
              travelInsurance: 'Travel Insurance',
              visa: 'Visa',
              passport: 'Passport',
            }).map(([key, label]) => {
              const files = request.documents.preApproval[key];
              if (request.subtype !== 'international' && (key === 'visa' || key === 'passport')) return null;
              return (
                <div key={key} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-100">
                  <div className="flex items-center gap-3">
                    <svg className={`w-4 h-4 ${files?.length ? 'text-status-approved' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span className="font-medium text-gray-800">{label}</span>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {files?.length ? files.map(f => f.name || f).join(', ') : 'Not uploaded'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

          {/* ── Section 3: Settlement claim (travel) ─────────────────────────── */}
          {request.type === 'travel' && request.stage === 'settlement' && stl && (
            <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-gray-50 flex items-center gap-2">
                <FileText size={18} className="text-samsung-blue" />
                <h3 className="text-sm font-semibold text-gray-900 m-0">Settlement Claim</h3>
              </div>
              <div className="p-6">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-border text-left">
                  <th className="p-4 font-medium text-gray-600">Category</th>
                  <th className="p-4 font-medium text-gray-600">Details</th>
                  <th className="p-4 font-medium text-gray-600 text-right">Amount</th>
                  <th className="p-4 font-medium text-gray-600 text-right">Reimbursable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-4 font-medium">Per Diem</td>
                  <td className="p-4 text-gray-500">{stl.perDiemDays} days @ {formatCurrency(stl.perDiemRate, stl.currency)}/day</td>
                  <td className="p-4 text-right font-mono">{formatCurrency(stl.perDiemTotal, stl.currency)}</td>
                  <td className="p-4 text-right font-mono text-status-approved font-medium">{formatCurrency(stl.perDiemTotal, stl.currency)}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Hotel</td>
                  <td className="p-4 text-gray-500">{stl.hotelName || 'N/A'}{stl.hotelCap ? ` · Cap: ${formatCurrency(stl.hotelCap, stl.currency)}/night` : ''}</td>
                  <td className="p-4 text-right font-mono">{formatCurrency(stl.hotelActual, stl.currency)}</td>
                  <td className="p-4 text-right font-mono text-status-approved font-medium">{formatCurrency(stl.hotelReimbursable, stl.currency)}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Flight</td>
                  <td className="p-4 text-gray-500">Actuals (no cap)</td>
                  <td className="p-4 text-right font-mono">{formatCurrency(stl.flightActual, stl.currency)}</td>
                  <td className="p-4 text-right font-mono text-status-approved font-medium">{formatCurrency(stl.flightReimbursable, stl.currency)}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Conveyance</td>
                  <td className="p-4 text-gray-500">{stl.conveyanceDetails || 'Local transport'}</td>
                  <td className="p-4 text-right font-mono">{formatCurrency(stl.conveyanceActual, stl.currency)}</td>
                  <td className="p-4 text-right font-mono text-status-approved font-medium">{formatCurrency(stl.conveyanceReimbursable, stl.currency)}</td>
                </tr>
                {stl.winterClothesActual > 0 && (
                  <tr>
                    <td className="p-4 font-medium text-purple-700">Winter Clothes</td>
                    <td className="p-4 text-gray-500">International trip allowance</td>
                    <td className="p-4 text-right font-mono">{formatCurrency(stl.winterClothesActual, stl.currency)}</td>
                    <td className="p-4 text-right font-mono text-purple-700 font-medium">{formatCurrency(stl.winterClothesReimbursable, stl.currency)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50">
                  <td colSpan={3} className="p-4 font-bold text-samsung-blue text-base">Total Reimbursable</td>
                  <td className="p-4 text-right font-mono font-bold text-samsung-blue text-lg">{formatCurrency(stl.totalReimbursable, stl.currency)}</td>
                </tr>
              </tfoot>
              </div>
              {/* Settlement documents */}
          {request.documents?.settlement && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Settlement Documents</h4>
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-100 text-sm">
                <div className="flex items-center gap-3">
                  <svg className={`w-4 h-4 ${request.documents.settlement?.length ? 'text-status-approved' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span className="font-medium text-gray-800">Receipts (Hotel, Flight, Conveyance)</span>
                </div>
                <span className="text-gray-500 text-xs">
                  {request.documents.settlement?.length ? `${request.documents.settlement.length} file(s) uploaded` : 'Not uploaded'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Internet bill breakdown ──────────────────────────────────────── */}
      {request.type === 'internet-bill' && request.internetBillRequest?.periods?.length > 0 && (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-samsung-blue border-b-2 border-blue-100 pb-2 mb-4">
            2. Bill Breakdown
          </h3>
          <div className="flex flex-col gap-3">
            {request.internetBillRequest.periods.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-border text-sm">
                <div>
                  <span className="font-medium text-gray-900">{p.periodLabel}</span>
                  {p.billDocument && <div className="text-xs text-gray-500 mt-1">{p.billDocument}</div>}
                </div>
                <strong className="font-mono">{formatCurrency(p.amount)}</strong>
              </div>
            ))}
            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-3 rounded-md text-sm mt-2">
              <span className="font-semibold text-samsung-blue">Total Claimable</span>
              <strong className="font-mono text-samsung-blue">{formatCurrency(request.internetBillRequest.claimableAmount)}</strong>
            </div>
          </div>
        </div>
      )}

              </div>
            </div>
          )}

        </div>

        {/* Right Rail: Action Panel & Context */}
        <div className="lg:col-span-4 flex flex-col gap-6 sticky top-6">

          {/* ── Finance Action Panel ─────────────────────────────────────────── */}
          {canAction ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border flex flex-col gap-5">
              <h3 className="text-base font-semibold text-gray-900 border-b border-border pb-3 m-0">
                Finance Decision
              </h3>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="financeNote" className="text-sm font-medium text-gray-900">
                  Reviewer Notes <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  id="financeNote"
                  rows={3}
                  value={note}
                  onChange={e => { setNote(e.target.value); setNoteErr(false); }}
                  placeholder="Enter observations or reasons for rejection..."
                  className={`w-full rounded-md border ${noteErr ? 'border-status-rejected ring-1 ring-status-rejected' : 'border-border'} p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-samsung-blue`}
                />
                {noteErr && <p className="text-xs text-status-rejected mt-1">A note is required when rejecting a request.</p>}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-samsung-blue text-white rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Check size={16} /> Approve
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction('more_info')}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-border text-gray-700 bg-white rounded-md font-medium text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Request Info
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-red-200 text-status-rejected bg-red-50 rounded-md font-medium text-sm hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-status-rejected disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg border border-border text-center text-sm text-gray-500 shadow-sm">
              <CheckCircle size={24} className="mx-auto mb-2 text-status-approved opacity-50" />
              This request has already been reviewed.
            </div>
          )}

          {/* ── Applicable Policy ─────────────────────────────────────────── */}
          {request.type === 'travel' && policyRates && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
              <h3 className="text-sm font-semibold text-gray-900 border-b border-border pb-3 mb-4 flex items-center gap-2">
                <Info size={16} className="text-samsung-blue" /> Applicable Policy Limits
              </h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Destination</span>
                  <strong className="text-gray-900">{request.destination}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Per Diem (CL3)</span>
                  <strong className="font-mono text-gray-900">{formatCurrency(policyRates.perDiem, policyRates.currency)}/day</strong>
                </div>
              </div>
            </div>
          )}

          {/* ── Audit Timeline ────────────────────────────────────────────── */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-border">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-border pb-3 mb-5 flex items-center gap-2">
              <Clock size={16} className="text-samsung-blue" /> Audit Timeline
            </h3>
            <div className="relative border-l border-gray-200 ml-3 space-y-6">
              <div className="relative pl-5">
                <span className="absolute -left-[21px] top-0.5 w-10 h-10 rounded-full flex items-center justify-center bg-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-samsung-blue"></span>
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Submitted</span>
                  <span className="text-xs text-gray-500">{formatDate(request.submittedAt)}</span>
                </div>
              </div>
              <div className="relative pl-5">
                <span className="absolute -left-[21px] top-0.5 w-10 h-10 rounded-full flex items-center justify-center bg-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-samsung-blue"></span>
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Under Review</span>
                  <span className="text-xs text-gray-500">Currently in queue</span>
                </div>
              </div>
              {!canAction && (
                <div className="relative pl-5">
                  <span className="absolute -left-[21px] top-0.5 w-10 h-10 rounded-full flex items-center justify-center bg-white">
                    <span className={`w-2.5 h-2.5 rounded-full ${currentStatus === 'rejected' ? 'bg-status-rejected' : 'bg-status-approved'}`}></span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 capitalize">{currentStatus}</span>
                    <span className="text-xs text-gray-500">Review complete</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
}
