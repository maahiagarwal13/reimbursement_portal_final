import React from 'react';
import { NavLink } from 'react-router-dom';
import { Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';
import { useLanguage } from '../../contexts/LanguageContext';

const labelKeyMap = {
  'Dashboard': 'nav.dashboard',
  'New Request': 'nav.newRequest',
  'My Requests': 'nav.myRequests',
  'My Vault': 'nav.myVault',
  'Policy & Limits': 'nav.policyLimits',
  'Review Queue': 'nav.reviewQueue',
  'Finance Dashboard': 'nav.financeDashboard',
  'All Requests': 'nav.allRequests',
  'Administration': 'nav.administration',
  'Admin Dashboard': 'nav.adminDashboard',
  'Employees': 'nav.employees',
  'Policy Config': 'nav.policyConfig',
  'Domestic Rates': 'nav.domesticRates',
  'International Rates': 'nav.internationalRates',
  'Relocation': 'nav.relocation',
  'Carpooling': 'nav.carpooling',
  'Internet': 'nav.internet',
};

export default function Sidebar({ role, items, currentPath }) {
  const { isCollapsed, toggleSidebar } = useSidebarCollapse();
  const { t } = useLanguage();

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-background dark:bg-gray-900 border-r border-border dark:border-gray-700 z-20 flex flex-col ${
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
      aria-label="Main navigation"
    >
      {/* Collapse Toggle */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-700 border border-border dark:border-gray-600 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:border-gray-400 z-30 shadow-sm"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand */}
      <div className={`flex items-center h-14 border-b border-border dark:border-gray-700 px-4 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="flex-shrink-0 text-samsung-blue" aria-hidden="true">
          <Zap size={24} />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-serif text-gray-900 dark:text-gray-100 font-semibold leading-tight whitespace-nowrap truncate">{t('nav.semPortal')}</span>
            <span className="text-[10px] uppercase font-mono text-gray-500 dark:text-gray-400 tracking-wide leading-tight truncate">{t('nav.reimbursement')}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
        {items.map((item, index) => {
          if (item.section) {
            if (isCollapsed) return <div key={`section-${index}`} className="my-2 border-t border-border dark:border-gray-700 mx-4" />;
            return (
              <div key={`section-${index}`} className="px-5 mt-4 mb-1 text-[10px] uppercase font-mono tracking-widest text-gray-400 dark:text-gray-500">
                {t(labelKeyMap[item.label] || item.label, item.label)}
              </div>
            );
          }

          const Icon = item.icon;
          const translatedLabel = t(labelKeyMap[item.label] || item.label, item.label);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/' || item.to?.endsWith('/dashboard')}
              title={isCollapsed ? translatedLabel : undefined}
              className={({ isActive }) =>
                `flex items-center h-10 mx-2 rounded-md ${
                  isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'
                } ${
                  isActive
                    ? 'bg-samsung-blue/5 dark:bg-samsung-blue/20 text-samsung-blue dark:text-blue-400 border-l-2 border-samsung-blue font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 border-l-2 border-transparent'
                }`
              }
            >
              {Icon && <Icon className="flex-shrink-0" size={isCollapsed ? 22 : 20} />}
              {!isCollapsed && <span className="truncate">{translatedLabel}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border dark:border-gray-700 text-center">
          <div className="text-[10px] font-mono uppercase tracking-wide text-gray-400 dark:text-gray-500 truncate">
            {t('nav.footer')}
          </div>
        </div>
      )}
    </aside>
  );
}
