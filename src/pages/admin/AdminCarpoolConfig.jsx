import React, { useState, useEffect } from 'react';
import { getRateConfig, saveRateConfig } from '../../services/rateConfig';
import Toast from '../../components/shared/Toast';
import FormField from '../../components/shared/FormField';
import Select from '../../components/shared/Select';

export default function AdminCarpoolConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const fuel = await getRateConfig('CarpoolOwnFuelRate');
        const mileage = await getRateConfig('CarpoolOwnMileage');
        const oneWay = await getRateConfig('CarpoolCapOneWay');
        const bothWay = await getRateConfig('CarpoolCapBothWay');
        
        setConfig({
          fuel: fuel?.value || '',
          mileage: mileage?.value || '',
          oneWayValue: oneWay?.value || '',
          oneWayUnit: oneWay?.unit || 'per_day',
          bothWayValue: bothWay?.value || '',
          bothWayUnit: bothWay?.unit || 'per_day'
        });
      } catch (err) {
        setToast({ visible: true, message: 'Failed to load config', type: 'error' });
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
      await saveRateConfig('CarpoolOwnFuelRate', { value: Number(config.fuel) });
      await saveRateConfig('CarpoolOwnMileage', { value: Number(config.mileage) });
      await saveRateConfig('CarpoolCapOneWay', { value: Number(config.oneWayValue), unit: config.oneWayUnit });
      await saveRateConfig('CarpoolCapBothWay', { value: Number(config.bothWayValue), unit: config.bothWayUnit });
      setToast({ visible: true, message: 'Config saved successfully', type: 'success' });
    } catch (err) {
      setToast({ visible: true, message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading config...</div>;

  const unitOptions = [
    { label: 'Per Day', value: 'per_day' },
    { label: 'Per Month', value: 'per_month' }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">Carpool Configuration</h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border">
          <h2 className="text-lg font-serif font-medium text-gray-900 mb-6 border-b border-border pb-2">Own Vehicle Formula</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormField 
              id="fuel" 
              label="Fuel Price (₹ per litre)" 
              type="number" 
              value={config.fuel} 
              onChange={e => setConfig({...config, fuel: e.target.value})} 
              required 
            />
            <FormField 
              id="mileage" 
              label="Mileage (km per litre)" 
              type="number" 
              value={config.mileage} 
              onChange={e => setConfig({...config, mileage: e.target.value})} 
              required 
            />
          </div>
          <p className="text-sm text-gray-500 mt-4 italic">
            Cost calculation: (Distance ÷ Mileage) × Fuel Price
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-border">
          <h2 className="text-lg font-serif font-medium text-gray-900 mb-6 border-b border-border pb-2">Reimbursement Caps</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-gray-900">One Way</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <FormField 
                    id="oneWayValue" 
                    label="Cap Amount (₹)" 
                    type="number" 
                    value={config.oneWayValue} 
                    onChange={e => setConfig({...config, oneWayValue: e.target.value})} 
                    required 
                  />
                </div>
                <div className="flex-1">
                  <Select 
                    id="oneWayUnit" 
                    label="Unit" 
                    options={unitOptions} 
                    value={config.oneWayUnit} 
                    onChange={e => setConfig({...config, oneWayUnit: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-gray-900">Both Ways</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <FormField 
                    id="bothWayValue" 
                    label="Cap Amount (₹)" 
                    type="number" 
                    value={config.bothWayValue} 
                    onChange={e => setConfig({...config, bothWayValue: e.target.value})} 
                    required 
                  />
                </div>
                <div className="flex-1">
                  <Select 
                    id="bothWayUnit" 
                    label="Unit" 
                    options={unitOptions} 
                    value={config.bothWayUnit} 
                    onChange={e => setConfig({...config, bothWayUnit: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-samsung-blue text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
