import React, { useState, useEffect } from 'react';
import { getRateConfig, saveRateConfig } from '../../services/rateConfig';
import Toast from '../../components/shared/Toast';

export default function AdminRelocationCaps() {
  const [caps, setCaps] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const acc = await getRateConfig('RelocationAccommodation');
        const bro = await getRateConfig('RelocationBrokerage');
        const shp = await getRateConfig('RelocationShipment');
        setCaps({ Accommodation: acc, Brokerage: bro, Shipment: shp });
      } catch (err) {
        setToast({ visible: true, message: 'Failed to load caps', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveRateConfig('RelocationAccommodation', caps.Accommodation);
      await saveRateConfig('RelocationBrokerage', caps.Brokerage);
      await saveRateConfig('RelocationShipment', caps.Shipment);
      setToast({ visible: true, message: 'Relocation caps saved successfully', type: 'success' });
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading caps...</div>;

  const clLevels = ['CL2', 'CL3', 'CL4'];
  const components = ['Accommodation', 'Brokerage', 'Shipment'];

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Relocation Caps</h1>
        <button 
          disabled={saving}
          onClick={handleSave}
          className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed w-max"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
              {clLevels.map(cl => <th key={cl} scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{cl}</th>)}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {components.map(comp => (
              <tr key={comp}>
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comp}</td>
                {clLevels.map(cl => (
                  <td key={cl} className="px-3 py-4 whitespace-nowrap">
                    <input 
                      type="number" 
                      value={caps[comp][cl] || ''} 
                      onChange={(e) => {
                        const newCaps = { ...caps };
                        newCaps[comp] = { ...newCaps[comp], [cl]: Number(e.target.value) };
                        setCaps(newCaps);
                      }}
                      className="block w-full min-w-[100px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-samsung-blue focus:border-samsung-blue sm:text-sm font-mono text-gray-900"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
