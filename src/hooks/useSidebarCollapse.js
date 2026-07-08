import { useState, useEffect, useCallback } from 'react';

export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    };
    window.addEventListener('sidebar-toggle', handleStorage);
    return () => window.removeEventListener('sidebar-toggle', handleStorage);
  }, []);

  const toggleSidebar = useCallback(() => {
    const newVal = !isCollapsed;
    localStorage.setItem('sidebar-collapsed', newVal);
    setIsCollapsed(newVal);
    window.dispatchEvent(new Event('sidebar-toggle'));
  }, [isCollapsed]);

  return { isCollapsed, toggleSidebar };
}
