import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Globe,
  Truck,
  Car,
  Wifi,
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';

const ADMIN_NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/employees', icon: Users, label: 'Employees' },
  { section: true, label: 'Policy Config' },
  { to: '/admin/policy/domestic', icon: MapPin, label: 'Domestic Rates' },
  { to: '/admin/policy/international', icon: Globe, label: 'International Rates' },
  { to: '/admin/policy/relocation', icon: Truck, label: 'Relocation' },
  { to: '/admin/policy/carpooling', icon: Car, label: 'Carpooling' },
  { to: '/admin/policy/internet', icon: Wifi, label: 'Internet' },
];

/**
 * AdminLayout — Page shell with admin sidebar + topbar.
 */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isCollapsed } = useSidebarCollapse();

  return (
    <>
      <Sidebar
        role="admin"
        items={ADMIN_NAV}
        currentPath={location.pathname}
      />
      <Topbar
        userName={user?.name || 'Admin User'}
        userRole="admin"
        department={user?.department || 'System Admin'}
        onLogout={logout}
      />
      <main className={`pt-14 min-h-screen bg-background ${isCollapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
        <Outlet />
      </main>
    </>
  );
}
