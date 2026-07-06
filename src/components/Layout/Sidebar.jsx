import React from 'react';
import { NavLink } from 'react-router-dom';
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';

export default function Sidebar({ role, items, currentPath }) {
  const { isCollapsed, toggleSidebar } = useSidebarCollapse();

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-background border-r border-border z-20 flex flex-col ${
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      aria-label="Main navigation"
    >
      {/* Collapse Toggle */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-border rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-400 z-30 shadow-sm"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand */}
      <div className={`flex items-center h-14 border-b border-border px-4 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="flex-shrink-0 text-samsung-blue" aria-hidden="true">
          <Zap size={24} />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-serif text-gray-900 font-semibold leading-tight whitespace-nowrap truncate">SEM Portal</span>
            <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wide leading-tight truncate">Reimbursement</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
        {items.map((item, index) => {
          if (item.section) {
            if (isCollapsed) return <div key={`section-${index}`} className="my-2 border-t border-border mx-4" />;
            return (
              <div key={`section-${index}`} className="px-5 mt-4 mb-1 text-[10px] uppercase font-mono tracking-widest text-gray-400">
                {item.label}
              </div>
            );
          }

          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/' || item.to?.endsWith('/dashboard')}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center h-10 mx-2 rounded-md ${
                  isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'
                } ${
                  isActive
                    ? 'bg-samsung-blue/5 text-samsung-blue border-l-2 border-samsung-blue font-medium'
                    : 'text-gray-600 hover:bg-gray-100/50 hover:text-gray-900 border-l-2 border-transparent'
                }`
              }
            >
              {Icon && <Icon className="flex-shrink-0" size={isCollapsed ? 22 : 20} />}
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border text-center">
          <div className="text-[10px] font-mono uppercase tracking-wide text-gray-400 truncate">
            Samsung Electro-Mechanics
          </div>
        </div>
      )}
    </aside>
  );
}
