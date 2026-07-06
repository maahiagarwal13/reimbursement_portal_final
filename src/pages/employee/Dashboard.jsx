import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getEmployeeDashboardStats } from '../../services/dashboard';
import { getRequestsByEmployee } from '../../services/requests';
import { getRateConfig } from '../../services/rateConfig';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/shared/Badge';
import { FileText, AlertCircle, Plus } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [attentionRequests, setAttentionRequests] = useState([]);
  const [policyRates, setPolicyRates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const dashboardStats = await getEmployeeDashboardStats(user.ghrId);
        const allRequests = await getRequestsByEmployee(user.ghrId);
        
        setStats(dashboardStats);
        
        const sorted = allRequests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        setRecentRequests(sorted.slice(0, 5));

        const needsAttention = sorted.filter(req => {
          if (req.stage === 'pre-approval' && req.preApprovalStatus === 'rejected') return true;
          if (req.stage === 'pre-approval' && req.preApprovalStatus === 'approved') return true;
          if (req.stage === 'settlement' && req.settlementStatus === 'rejected') return true;
          return false;
        });
        setAttentionRequests(needsAttention);

        const cl = user.clLevel || 'CL3';
        const [domesticPerDiem, domesticHotel, internetCap] = await Promise.all([
          getRateConfig('domesticPerDiem'),
          getRateConfig('domesticHotel'),
          getRateConfig('internetCap')
        ]);
        
        let perDiemRate = cl === 'CL3' ? domesticPerDiem?.rates?.['CL3']?.['under5']?.value : domesticPerDiem?.rates?.[cl]?.value;
        if (!perDiemRate) perDiemRate = domesticPerDiem?.rates?.['CL3']?.['under5']?.value;
        
        let hotelRate = cl === 'CL3' ? domesticHotel?.rates?.['CL3']?.['under5']?.[0] : domesticHotel?.rates?.[cl]?.[0];
        if (hotelRate === undefined) hotelRate = domesticHotel?.rates?.['CL3']?.['under5']?.[0];

        let intCap = internetCap?.rates?.[cl]?.value || 1500;

        setPolicyRates({
          perDiem: perDiemRate,
          hotelCap: hotelRate,
          internet: intCap
        });

      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadDashboard();
    }
  }, [user]);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const columns = [
    { key: 'id', label: 'ID', isNumeric: true, render: (val) => val.slice(0,8) },
    { key: 'type', label: 'Type', render: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
    { key: 'submittedAt', label: 'Submitted', isNumeric: true, render: (val) => formatDate(val) },
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
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-4">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Welcome back, {user.name}</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">{user.role} • {user.department || user.team}</p>
      </div>
      
      {/* Flat Stat Row */}
      <div className="flex items-center divide-x divide-border border border-border rounded-lg bg-white overflow-hidden shadow-sm">
        <div 
          className="flex-1 py-6 px-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50" 
          onClick={() => navigate('/employee/requests')}
        >
          <div className="font-serif text-4xl text-gray-900">{stats?.totalCount || 0}</div>
          <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-2">Total Requests</div>
        </div>
        <div className="flex-1 py-6 px-8 flex flex-col items-center justify-center">
          <div className="font-serif text-4xl text-gray-900">{stats?.pendingCount || 0}</div>
          <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-2">Pending Reviews</div>
        </div>
        <div className="flex-1 py-6 px-8 flex flex-col items-center justify-center">
          <div className="font-serif text-4xl text-status-approved">{stats?.approvedCount || 0}</div>
          <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-2">Approved</div>
        </div>
        <div className="flex-1 py-6 px-8 flex flex-col items-center justify-center">
          <div className="font-serif text-4xl text-status-rejected">{stats?.rejectedCount || 0}</div>
          <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-2">Rejected</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="flex flex-col gap-8">
          {/* Needs Attention */}
          <div>
            <h2 className="font-serif text-xl font-medium text-gray-900 pb-2 mb-4 border-b border-border flex items-center gap-2">
              <AlertCircle size={20} className="text-samsung-blue" /> Needs Your Attention
            </h2>
            {attentionRequests.length > 0 ? (
              <div className="bg-white rounded-md border border-border overflow-hidden">
                <DataTable 
                  columns={columns} 
                  data={attentionRequests} 
                  pagination={false}
                  onRowClick={(row) => navigate(`/employee/requests/${row.id}`)}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 bg-white border border-border rounded-lg text-center">
                <div className="w-12 h-12 bg-blue-50 text-samsung-blue rounded-full flex items-center justify-center mb-4">
                  <FileText size={24} />
                </div>
                <p className="text-gray-600 mb-6 max-w-sm">You're all caught up. No requests need your immediate attention.</p>
                <button 
                  onClick={() => navigate('/employee/new-request')}
                  className="flex items-center gap-2 bg-samsung-blue text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-samsung-blue"
                >
                  <Plus size={16} /> New Request
                </button>
              </div>
            )}
          </div>
          
          {/* Recent Requests */}
          <div>
            <div className="flex items-end justify-between border-b border-border pb-2 mb-4">
              <h2 className="font-serif text-xl font-medium text-gray-900">Recent Requests</h2>
              <button 
                onClick={() => navigate('/employee/requests')}
                className="text-samsung-blue font-semibold text-sm hover:underline"
              >
                View All
              </button>
            </div>
            <div className="bg-white rounded-md border border-border overflow-hidden">
              <DataTable 
                columns={columns} 
                data={recentRequests} 
                emptyMessage="No recent requests found" 
                pagination={false}
                onRowClick={(row) => navigate(`/employee/requests/${row.id}`)}
              />
            </div>
          </div>
        </div>

        {/* Policy Quick Reference */}
        <div>
          <h2 className="font-serif text-xl font-medium text-gray-900 pb-2 mb-4 border-b border-border">Policy Quick Reference</h2>
          <div className="bg-white p-6 rounded-lg border border-border">
            <p className="text-sm text-gray-500 mb-6">
              Applicable limits based on your level ({user.clLevel || 'CL3'})
            </p>
            
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-600">Domestic Per Diem</span>
                <span className="font-mono font-medium text-gray-900">₹{policyRates?.perDiem ?? '-'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-600">Domestic Hotel (Area A+)</span>
                <span className="font-mono font-medium text-gray-900">{policyRates?.hotelCap === null ? 'Actuals' : `₹${policyRates?.hotelCap ?? '-'}`}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-100">
                <span className="text-gray-600">Internet Monthly Cap</span>
                <span className="font-mono font-medium text-gray-900">₹{policyRates?.internet ?? '-'}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-600">International Flight</span>
                <span className="font-mono font-medium text-gray-500 uppercase tracking-wide text-xs">Actuals</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
