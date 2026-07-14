import React from 'react';
import { User, LogOut, Moon, Sun, Globe } from 'lucide-react';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Topbar({
  userName,
  department,
  onLogout,
}) {
  const { isCollapsed } = useSidebarCollapse();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <header 
      className={`fixed top-0 right-0 h-14 bg-white dark:bg-gray-800 border-b border-border dark:border-gray-700 flex items-center justify-between px-6 z-10 ${
        isCollapsed ? 'left-[72px]' : 'left-[260px]'
      }`}
    >
      <div className="flex items-center">
        <div className="text-gray-900 dark:text-gray-100 font-medium">
          <span className="font-serif text-lg">SEM Portal</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        
        {/* Toggles */}
        <div className="flex items-center gap-4 border-r border-border dark:border-gray-700 pr-6">
          <button 
            onClick={toggleTheme} 
            className="text-gray-500 hover:text-samsung-blue dark:hover:text-blue-400 focus:outline-none"
            title={t('common.' + (theme === 'dark' ? 'lightMode' : 'darkMode'))}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={toggleLanguage} 
            className="flex items-center gap-1 text-gray-500 hover:text-samsung-blue dark:hover:text-blue-400 font-medium text-sm focus:outline-none"
            title="Toggle Language"
          >
            <Globe size={18} />
            <span className="uppercase leading-none">{lang}</span>
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center border border-border dark:border-gray-600" aria-hidden="true">
            <User size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">{userName}</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-mono leading-tight">{department}</span>
          </div>
        </div>

        {/* Logout */}
        <div className="flex items-center border-l border-border dark:border-gray-700 pl-6">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-status-rejected dark:text-gray-400 dark:hover:text-red-400"
            onClick={onLogout}
            aria-label="Log out"
          >
            <LogOut size={16} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
