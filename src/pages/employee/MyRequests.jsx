import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRequestsByEmployee } from '../../services/requests';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/shared/Badge';
import { formatDate } from '../../utils/formatters';

export default function MyRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await getRequestsByEmployee(user.ghrId);
        setRequests(data.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
      } catch (err) {
        console.error("Failed to load requests", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadRequests();
    }
  }, [user]);

  if (loading) {
    return <div className="p-6">Loading requests...</div>;
  }

  const columns = [
    { key: 'id', label: 'ID', isNumeric: true, render: (val) => val.slice(0,8) },
    { key: 'type', label: 'Type', render: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
    { key: 'submittedAt', label: 'Submitted Date', isNumeric: true, render: (val) => formatDate(val) },
    { 
      key: 'stage', 
      label: 'Stage', 
      render: (val, row) => {
        let status = 'pending';
        if (row.stage === 'draft') status = 'draft';
        else if (row.stage === 'pre-approval' && row.preApprovalStatus === 'approved') status = 'approved';
        else if (row.stage === 'pre-approval' && row.preApprovalStatus === 'rejected') status = 'rejected';
        else if (row.stage === 'settlement' && row.settlementStatus === 'approved') status = 'approved';
        else if (row.stage === 'settlement' && row.settlementStatus === 'rejected') status = 'rejected';
        return <Badge status={status}>{val}</Badge>;
      } 
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => {
        if (row.type === 'travel' && row.stage === 'pre-approval' && row.preApprovalStatus === 'approved' && !row.settlement) {
          return (
            <div className="flex gap-2 justify-end">
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/new-request/travel/extend/${row.id}`); }}
                className="text-xs bg-white text-gray-700 border border-border px-3 py-1.5 rounded font-medium hover:bg-gray-50 focus:outline-none"
              >
                Extend
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/requests/${row.id}/settlement`); }}
                className="text-xs bg-samsung-blue text-white px-3 py-1.5 rounded font-medium hover:bg-blue-800 focus:outline-none"
              >
                Settle
              </button>
            </div>
          );
        }
        return null;
      }
    }
  ];

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto flex flex-col gap-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">My Requests</h1>
          <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">Track and manage your submitted reimbursements</p>
        </div>
        <button 
          onClick={() => navigate('/new-request')}
          className="bg-samsung-blue text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue w-full sm:w-auto text-center"
        >
          New Request
        </button>
      </div>

      <div className="bg-white rounded-md border border-border overflow-hidden">
        <DataTable 
          columns={columns} 
          data={requests} 
          emptyMessage="You have not submitted any requests yet."
          onRowClick={(row) => {
            if (row.stage === 'draft') {
              if (row.type === 'travel') navigate(`/new-request/travel?draftId=${row.id}`);
              else if (row.type === 'internet-bill') navigate(`/new-request/internet?draftId=${row.id}`);
              else if (row.type === 'carpool') navigate(`/new-request/carpool?draftId=${row.id}`);
              else if (row.type === 'relocation') navigate(`/new-request/relocation?draftId=${row.id}`);
            } else {
              navigate(`/requests/${row.id}`);
            }
          }}
        />
      </div>
    </div>
  );
}
