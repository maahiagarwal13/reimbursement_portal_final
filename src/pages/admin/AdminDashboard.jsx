import React, { useState, useEffect } from 'react';
import { getAdminDashboardStats } from '../../services/dashboard';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getAdminDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load admin stats", err);
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
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">System overview and policy configuration</p>
      </div>
      
      {/* Flat Stat Row */}
      <div className="flex items-center divide-x divide-border border border-border rounded-lg bg-white overflow-hidden shadow-sm">
        <div className="flex-1 py-6 px-8 flex flex-col items-center justify-center">
          <div className="font-serif text-4xl text-gray-900">{stats?.employeeCount || 0}</div>
          <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-2">Total Employees</div>
        </div>
        <div className="flex-1 py-6 px-8 flex flex-col items-center justify-center">
          <div className="font-serif text-4xl text-gray-900">{stats?.activePolicies || 0}</div>
          <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-2">Active Policies</div>
        </div>
        <div className="flex-1 py-6 px-8 flex flex-col items-center justify-center">
          <div className="font-serif text-4xl text-gray-900">{stats?.monthlyVolume || 0}</div>
          <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-2">Monthly Volume</div>
        </div>
      </div>
    </div>
  );
}
