import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRequests } from '../../services/requests';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/shared/Badge';
import { formatDate } from '../../utils/formatters';

export default function FinanceRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await getAllRequests();
        setRequests(data.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
      } catch (err) {
        console.error("Failed to load requests", err);
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, []);

  if (loading) return <div className="p-6">Loading requests...</div>;

  const columns = [
    { key: 'id', label: 'ID', isNumeric: true, render: (val) => val.slice(0,8) },
    { key: 'ghrId', label: 'GHR ID', isNumeric: true },
    { key: 'type', label: 'Type', render: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
    { key: 'submittedAt', label: 'Submitted Date', isNumeric: true, render: (val) => formatDate(val) },
    { 
      key: 'stage', 
      label: 'Stage', 
      render: (val, row) => {
        let status = 'pending';
        if (row.stage === 'pre-approval' && row.preApprovalStatus === 'approved') status = 'approved';
        if (row.stage === 'pre-approval' && row.preApprovalStatus === 'rejected') status = 'rejected';
        if (row.stage === 'settlement' && row.settlementStatus === 'approved') status = 'approved';
        if (row.stage === 'settlement' && row.settlementStatus === 'rejected') status = 'rejected';
        return <Badge status={status}>{val}</Badge>;
      } 
    },
  ];

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto flex flex-col gap-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">All Requests</h1>
          <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">View and manage all employee requests across the organization</p>
        </div>
      </div>

      <div className="bg-white rounded-md border border-border overflow-hidden shadow-sm">
        <DataTable 
          columns={columns} 
          data={requests} 
          emptyMessage="No requests found."
          onRowClick={(row) => navigate(`/finance/requests/${row.id}`)}
        />
      </div>
    </div>
  );
}
