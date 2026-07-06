import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, FileText, BookOpen } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';

const EMPLOYEE_NAV = [
  { to: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employee/new-request', icon: Plus, label: 'New Request' },
  { to: '/employee/my-requests', icon: FileText, label: 'My Requests' },
  { to: '/employee/policy', icon: BookOpen, label: 'Policy & Limits' },
];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isCollapsed } = useSidebarCollapse();

  return (
    <>
      <Sidebar
        role="employee"
        items={EMPLOYEE_NAV}
        currentPath={location.pathname}
      />
      <Topbar
        userName={user?.name || 'Employee'}
        userRole="employee"
        department={user?.department || ''}
        onLogout={logout}
      />
      <main className={`pt-14 min-h-screen bg-background ${isCollapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
        <Outlet />
      </main>
    </>
  );
}
