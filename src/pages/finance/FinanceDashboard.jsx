import React, { useState, useEffect } from 'react';
import { getFinanceDashboardStats } from '../../services/dashboard';
import { useNavigate } from 'react-router-dom';
import { FileStack, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

export default function FinanceDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getFinanceDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load finance stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-4">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Finance Dashboard</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">Overview of portal activity and pending settlements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Review Queue Card */}
        <div className="bg-white p-8 rounded-lg border-t-4 border-samsung-blue border-l border-r border-b border-border shadow-sm flex flex-col items-start gap-4">
          <div className="flex items-center gap-2 text-samsung-blue">
            <AlertCircle size={20} />
            <h2 className="font-serif text-xl font-medium text-gray-900 m-0">Needs Your Attention</h2>
          </div>
          
          <div className="my-6">
            <div className="font-serif text-6xl font-bold leading-none text-gray-900">
              {stats?.pendingReviews || 0}
            </div>
            <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-3">
              Requests pending finance review
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/finance/requests')}
            className="w-full mt-auto flex items-center justify-center gap-2 bg-samsung-blue text-white py-3 px-4 rounded-md font-medium text-sm hover:bg-blue-800 transition-none"
          >
            Go to Review Queue <ArrowRight size={16} />
          </button>
        </div>

        {/* Other Stats */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center justify-center bg-white border border-border rounded-lg shadow-sm flex-1 p-8">
            <div className="font-serif text-5xl text-status-approved">{stats?.approvedToday || 0}</div>
            <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-3">Approved Today</div>
          </div>
          <div className="flex flex-col items-center justify-center bg-white border border-border rounded-lg shadow-sm flex-1 p-8">
            <div className="font-serif text-5xl text-gray-900">{stats?.totalRequests || 0}</div>
            <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-3">Total Request Volume</div>
          </div>
        </div>
      </div>
    </div>
  );
}
