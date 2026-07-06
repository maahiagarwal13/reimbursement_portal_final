import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileStack } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';
import Modal from '../shared/Modal';
import FormField from '../shared/FormField';

const FINANCE_NAV = [
  { to: '/finance/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { section: true, label: 'Review' },
  { to: '/finance/requests', icon: FileStack, label: 'All Requests' },
];

/**
 * FinanceLayout — Page shell with finance sidebar + topbar + view-as-employee.
 */
export default function FinanceLayout() {
  const { user, logout, viewAsEmployee, exitViewAs, setViewAsEmployee } = useAuth();
  const location = useLocation();
  const { isCollapsed } = useSidebarCollapse();
  const [showViewAsModal, setShowViewAsModal] = useState(false);
  const [viewAsGhrId, setViewAsGhrId] = useState('');

  const handleViewAsClick = () => {
    setShowViewAsModal(true);
  };

  const handleViewAsSubmit = () => {
    if (viewAsGhrId.trim()) {
      setViewAsEmployee({
        name: `Employee ${viewAsGhrId}`,
        ghrId: viewAsGhrId.trim(),
      });
      setShowViewAsModal(false);
      setViewAsGhrId('');
    }
  };

  return (
    <>
      <Sidebar
        role="finance"
        items={FINANCE_NAV}
        currentPath={location.pathname}
      />
      <Topbar
        userName={user?.name || 'Finance User'}
        userRole="finance"
        department={user?.department || 'Finance'}
        onLogout={logout}
        viewAsEmployee={viewAsEmployee}
        onExitViewAs={exitViewAs}
        onViewAsClick={handleViewAsClick}
      />
      <main className={`pt-14 min-h-screen bg-background ${isCollapsed ? 'ml-[72px]' : 'ml-[260px]'} ${viewAsEmployee ? 'mt-10' : ''}`}>
        <Outlet />
      </main>

      {/* View As Employee Modal */}
      <Modal
        isOpen={showViewAsModal}
        onClose={() => setShowViewAsModal(false)}
        title="View as Employee"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn btn--secondary btn--md"
              onClick={() => setShowViewAsModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary btn--md"
              onClick={handleViewAsSubmit}
              disabled={!viewAsGhrId.trim()}
            >
              View as Employee
            </button>
          </>
        }
      >
        <FormField
          label="Employee GHR ID"
          id="view-as-ghr-id"
          type="text"
          placeholder="Enter GHR ID"
          value={viewAsGhrId}
          onChange={(e) => setViewAsGhrId(e.target.value)}
          helpText="Enter the GHR ID of the employee to view their portal."
        />
      </Modal>
    </>
  );
}
