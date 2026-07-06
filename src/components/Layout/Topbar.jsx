import React from 'react';
import { User, LogOut, Eye, ArrowLeft } from 'lucide-react';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';

export default function Topbar({
  userName,
  userRole,
  department,
  onLogout,
  viewAsEmployee,
  onExitViewAs,
  onViewAsClick,
}) {
  const roleLabel =
    userRole === 'finance' ? 'Finance' : userRole === 'admin' ? 'Admin' : 'Employee';
  const { isCollapsed } = useSidebarCollapse();

  return (
    <>
      <header 
        className={`fixed top-0 right-0 h-14 bg-white border-b border-border flex items-center justify-between px-6 z-10 ${
          isCollapsed ? 'left-[72px]' : 'left-[260px]'
        }`}
      >
        <div className="flex items-center">
          <div className="text-gray-900 font-medium">
            <span className="font-serif text-lg">{roleLabel} Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* View As Employee button (Finance only) */}
          {userRole === 'finance' && !viewAsEmployee && onViewAsClick && (
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-samsung-blue bg-blue-50 rounded-md hover:bg-blue-100"
              onClick={onViewAsClick}
              aria-label="View as Employee"
            >
              <Eye size={16} />
              <span>View as Employee</span>
            </button>
          )}

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center border border-border" aria-hidden="true">
              <User size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 leading-tight">{userName}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide font-mono leading-tight">{department}</span>
            </div>
          </div>

          {/* Logout */}
          <div className="flex items-center border-l border-border pl-6">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-status-rejected"
              onClick={onLogout}
              aria-label="Log out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Proxy Banner */}
      {viewAsEmployee && (
        <div className={`fixed top-14 right-0 bg-status-pending text-white px-6 py-2 flex items-center justify-between text-sm font-medium z-10 ${
          isCollapsed ? 'left-[72px]' : 'left-[260px]'
        }`} role="status">
          <div className="flex items-center gap-2">
            <Eye size={14} aria-hidden="true" />
            <span>
              Viewing as: {viewAsEmployee.name} ({viewAsEmployee.ghrId})
            </span>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 hover:underline"
            onClick={onExitViewAs}
            aria-label="Exit employee view"
          >
            <ArrowLeft size={12} />
            Exit View
          </button>
        </div>
      )}
    </>
  );
}
