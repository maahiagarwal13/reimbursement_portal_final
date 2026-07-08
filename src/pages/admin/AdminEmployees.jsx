import React, { useState, useEffect } from 'react';
import { getAllEmployees, saveEmployee, deleteEmployee } from '../../services/employees';
import DataTable from '../../components/shared/DataTable';
import Toast from '../../components/shared/Toast';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllEmployees();
      setEmployees(data);
    } catch (err) {
      setToast({ visible: true, message: 'Failed to load employees', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleFlag = async (ghrId, flagName, currentValue) => {
    try {
      await saveEmployee({ ghrId, [flagName]: !currentValue });
      setToast({ visible: true, message: 'Permissions updated', type: 'success' });
      // Update local state without full reload
      setEmployees(prev => prev.map(emp => 
        emp.ghrId === ghrId ? { ...emp, [flagName]: !currentValue } : emp
      ));
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'ghrId', label: 'GHR ID', sortable: true, isNumeric: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'clLevel', label: 'CL Level', sortable: true, render: (val) => val || '—' },
    { key: 'hasFinanceAccess', label: 'Finance Access', render: (val, row) => (
      <div className="flex items-center justify-center">
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={!!val} 
            onChange={() => handleToggleFlag(row.ghrId, 'hasFinanceAccess', !!val)}
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-samsung-blue"></div>
        </label>
      </div>
    )},
    { key: 'hasAdminAccess', label: 'Admin Access', render: (val, row) => (
      <div className="flex items-center justify-center">
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={!!val} 
            onChange={() => handleToggleFlag(row.ghrId, 'hasAdminAccess', !!val)}
          />
          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-samsung-blue"></div>
        </label>
      </div>
    )},
    { key: 'actions', label: '', render: (_, row) => (
      <button 
        onClick={(e) => { e.stopPropagation(); handleDelete(row.ghrId); }}
        className="text-status-rejected text-sm font-medium hover:underline bg-transparent border-none p-0 cursor-pointer focus:outline-none"
      >
        Remove
      </button>
    )}
  ];

  const handleDelete = async (ghrId) => {
    if (!window.confirm('Are you sure you want to remove this employee?')) return;
    try {
      await deleteEmployee(ghrId);
      setToast({ visible: true, message: 'Employee removed successfully', type: 'success' });
      loadData();
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const term = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      (emp.department && emp.department.toLowerCase().includes(term))
    );
  });

  if (loading && employees.length === 0) return <div className="p-6">Loading employees...</div>;

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">Employee Management</h1>
          <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">Manage system access and roles</p>
        </div>
        <button className="bg-samsung-blue text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue">
          Add Employee
        </button>
      </div>

      {/* Static Filters */}
      <div className="flex gap-4">
        <input 
          type="text"
          placeholder="Filter by name or department..."
          className="border border-border rounded-md px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:border-samsung-blue"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filteredEmployees} 
          emptyMessage="No employees found matching the criteria."
        />
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
