import React, { useState, useEffect } from 'react';
import { getRateConfig, saveRateConfig } from '../../services/rateConfig';
import Toast from '../../components/shared/Toast';

export default function AdminInternetCaps() {
  const [caps, setCaps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getRateConfig('InternetCap');
        setCaps(data);
      } catch (err) {
        setToast({ visible: true, message: 'Failed to load caps', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveRateConfig('InternetCap', caps);
      setToast({ visible: true, message: 'Internet caps saved successfully', type: 'success' });
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading caps...</div>;

  const clLevels = ['CL2', 'CL3', 'CL4'];

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Internet Caps</h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border">
          <h2 className="text-lg font-serif font-medium text-gray-900 mb-6 border-b border-border pb-2">Monthly Limit (₹)</h2>
          
          <div className="flex flex-col gap-4">
            {clLevels.map(cl => (
              <div key={cl} className="flex items-center gap-4">
                <label className="w-16 font-medium text-gray-700 text-sm">{cl}</label>
                <input 
                  type="number" 
                  value={caps[cl] || ''} 
                  onChange={(e) => setCaps({ ...caps, [cl]: Number(e.target.value) })}
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-samsung-blue focus:border-samsung-blue sm:text-sm font-mono text-gray-900"
                  required
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
