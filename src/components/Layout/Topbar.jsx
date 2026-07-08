import React from 'react';
import { User, LogOut, Eye, ArrowLeft } from 'lucide-react';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';

export default function Topbar({
  userName,
  department,
  onLogout,
}) {
  const { isCollapsed } = useSidebarCollapse();

  return (
    <header 
      className={`fixed top-0 right-0 h-14 bg-white border-b border-border flex items-center justify-between px-6 z-10 ${
        isCollapsed ? 'left-[72px]' : 'left-[260px]'
      }`}
    >
      <div className="flex items-center">
        <div className="text-gray-900 font-medium">
          <span className="font-serif text-lg">SEM Portal</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
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
  );
}
