import React, { useState, useEffect } from 'react';
import { getAllEmployees, saveEmployee, deleteEmployee } from '../../services/employees';
import DataTable from '../../components/shared/DataTable';
import Toast from '../../components/shared/Toast';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

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

  const columns = [
    { key: 'ghrId', label: 'GHR ID', sortable: true, isNumeric: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'clLevel', label: 'CL Level', sortable: true, render: (val) => val || '—' },
    { key: 'role', label: 'Role', sortable: true, render: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
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

  if (loading && employees.length === 0) return <div className="p-6">Loading employees...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Employee Management</h1>
        <button className="bg-samsung-blue text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue">
          Add Employee
        </button>
      </div>

      <div className="bg-white rounded-md border border-border shadow-sm overflow-hidden">
        <DataTable 
          columns={columns} 
          data={employees} 
          emptyMessage="No employees found."
        />
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
