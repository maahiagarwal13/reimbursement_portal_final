import React, { useState, useEffect } from 'react';
import { getRateConfig, saveRateConfig, getDomesticCityTiers, saveDomesticCityTiers } from '../../services/rateConfig';
import Toast from '../../components/shared/Toast';

export default function AdminDomesticRates() {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const pd = await getRateConfig('DomesticPerDiem');
        const htl = await getRateConfig('DomesticHotel');
        setRates({ pd, htl });
      } catch (err) {
        setToast({ visible: true, message: 'Failed to load rates', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveRateConfig('DomesticPerDiem', rates.pd);
      await saveRateConfig('DomesticHotel', rates.htl);
      setToast({ visible: true, message: 'Rates saved successfully', type: 'success' });
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading rates...</div>;

  const clLevels = ['CL2', 'CL3/under5', 'CL3/over5', 'CL4'];
  const areas = ['Area A+', 'Area A', 'Area B', 'Area C'];

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Domestic Travel Rates</h1>
        <div>
          <button 
            disabled={saving}
            onClick={handleSave}
            className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border">
        <h2 className="text-lg font-serif font-medium text-gray-900 mb-6 border-b border-border pb-2">Per Diem</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {clLevels.map(cl => (
            <div key={cl} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">{cl}</label>
              <input 
                type="number" 
                value={rates.pd[cl] || ''} 
                onChange={(e) => setRates({ ...rates, pd: { ...rates.pd, [cl]: Number(e.target.value) } })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-samsung-blue focus:border-samsung-blue sm:text-sm font-mono text-gray-900"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border">
        <h2 className="text-lg font-serif font-medium text-gray-900 mb-6 border-b border-border pb-2">Hotel Caps</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CL Level</th>
                {areas.map(area => <th key={area} scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{area}</th>)}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clLevels.map(cl => (
                <tr key={cl}>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cl}</td>
                  {areas.map((area, idx) => (
                    <td key={area} className="px-3 py-4 whitespace-nowrap">
                      <input 
                        type="number" 
                        placeholder="Actuals"
                        value={rates.htl[cl]?.[idx] === null ? '' : rates.htl[cl]?.[idx]} 
                        onChange={(e) => {
                          const newHtl = { ...rates.htl };
                          newHtl[cl] = [...newHtl[cl]];
                          newHtl[cl][idx] = e.target.value === '' ? null : Number(e.target.value);
                          setRates({ ...rates, htl: newHtl });
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
        <p className="text-xs text-gray-500 mt-4 italic">* Leave blank for uncapped (Actuals)</p>
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
