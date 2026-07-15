import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Plus, 
  FileText, 
  BookOpen,
  FileStack,
  Users,
  MapPin,
  Globe,
  Truck,
  Car,
  Wifi,
  Cloud
} from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';

export default function BaseLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isCollapsed } = useSidebarCollapse();

  // Base navigation items for all users
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/new-request', icon: Plus, label: 'New Request' },
    { to: '/requests', icon: FileText, label: 'My Requests' },
    { to: '/my-vault', icon: Cloud, label: 'My Vault' },
    { to: '/policy', icon: BookOpen, label: 'Policy & Limits' },
  ];

  // Append Finance nav if user has flag
  if (user?.hasFinanceAccess) {
    navItems.push(
      { section: true, label: 'Review Queue' },
      { to: '/finance/dashboard', icon: LayoutDashboard, label: 'Finance Dashboard' },
      { to: '/finance/requests', icon: FileStack, label: 'All Requests' },
      { to: '/finance/kyc-approvals', icon: FileStack, label: 'Vehicle KYC Approvals' }
    );
  }

  // Append Admin nav if user has flag
  if (user?.hasAdminAccess) {
    navItems.push(
      { section: true, label: 'Administration' },
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
      { to: '/admin/employees', icon: Users, label: 'Employees' },
      { section: true, label: 'Policy Config' },
      { to: '/admin/policy/domestic', icon: MapPin, label: 'Domestic Rates' },
      { to: '/admin/policy/international', icon: Globe, label: 'International Rates' },
      { to: '/admin/policy/relocation', icon: Truck, label: 'Relocation' },
      { to: '/admin/policy/carpooling', icon: Car, label: 'Carpooling' },
      { to: '/admin/policy/internet', icon: Wifi, label: 'Internet' }
    );
  }

  return (
    <>
      <Sidebar
        items={navItems}
        currentPath={location.pathname}
      />
      <Topbar
        userName={user?.name || 'User'}
        department={user?.department || ''}
        onLogout={logout}
      />
      <main className={`pt-14 min-h-screen bg-background dark:bg-gray-900 ${isCollapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
        <Outlet />
      </main>
    </>
  );
}
