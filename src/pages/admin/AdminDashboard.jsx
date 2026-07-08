import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="p-6 w-full max-w-[1600px] mx-auto flex flex-col gap-8">
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
          <div className="font-serif text-4xl text-gray-900">{stats?.activePolicyCount || 0}</div>
          <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-2">Active Policies</div>
        </div>
        <div className="flex-1 py-6 px-8 flex flex-col items-center justify-center">
          <div className="font-serif text-4xl text-gray-900">{stats?.monthlyVolume || 0}</div>
          <div className="font-mono text-[10px] tracking-wide uppercase text-gray-500 mt-2">Monthly Volume</div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="font-serif text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/admin/employees" className="block bg-white p-6 rounded-lg border border-border shadow-sm hover:border-samsung-blue transition-colors">
            <h3 className="font-medium text-gray-900 mb-1">Employee Management</h3>
            <p className="text-sm text-gray-500">Manage permission flags and access.</p>
          </Link>
          <Link to="/admin/policy/domestic" className="block bg-white p-6 rounded-lg border border-border shadow-sm hover:border-samsung-blue transition-colors">
            <h3 className="font-medium text-gray-900 mb-1">Domestic Rates</h3>
            <p className="text-sm text-gray-500">Configure per diem and hotel limits.</p>
          </Link>
          <Link to="/admin/policy/international" className="block bg-white p-6 rounded-lg border border-border shadow-sm hover:border-samsung-blue transition-colors">
            <h3 className="font-medium text-gray-900 mb-1">International Rates</h3>
            <p className="text-sm text-gray-500">Configure international tier rates.</p>
          </Link>
          <Link to="/admin/policy/relocation" className="block bg-white p-6 rounded-lg border border-border shadow-sm hover:border-samsung-blue transition-colors">
            <h3 className="font-medium text-gray-900 mb-1">Relocation</h3>
            <p className="text-sm text-gray-500">Manage relocation allowances by level.</p>
          </Link>
          <Link to="/admin/policy/carpooling" className="block bg-white p-6 rounded-lg border border-border shadow-sm hover:border-samsung-blue transition-colors">
            <h3 className="font-medium text-gray-900 mb-1">Carpooling</h3>
            <p className="text-sm text-gray-500">Set carpool distance thresholds.</p>
          </Link>
          <Link to="/admin/policy/internet" className="block bg-white p-6 rounded-lg border border-border shadow-sm hover:border-samsung-blue transition-colors">
            <h3 className="font-medium text-gray-900 mb-1">Internet</h3>
            <p className="text-sm text-gray-500">Manage home internet caps.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
