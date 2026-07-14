import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRateConfig } from '../../services/rateConfig';
import { formatCurrency } from '../../utils/formatters';

export default function PolicyLimits() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Rate state
  const [domRates, setDomRates] = useState(null);
  const [domHotels, setDomHotels] = useState(null);
  const [intlRates, setIntlRates] = useState(null);
  const [intlHotels, setIntlHotels] = useState(null);
  const [internetCap, setInternetCap] = useState(null);
  const [relocationCaps, setRelocationCaps] = useState(null);
  
  useEffect(() => {
    async function loadPolicies() {
      try {
        const pd = await getRateConfig('DomesticPerDiem');
        const htl = await getRateConfig('DomesticHotel');
        const intlPd = await getRateConfig('IntlPerDiem');
        const intlHtl = await getRateConfig('IntlHotel');
        const net = await getRateConfig('InternetCap');
        const relAcc = await getRateConfig('RelocationAccommodation');
        const relBro = await getRateConfig('RelocationBrokerage');
        const relShp = await getRateConfig('RelocationShipment');
        
        setDomRates(pd);
        setDomHotels(htl);
        setIntlRates(intlPd);
        setIntlHotels(intlHtl);
        setInternetCap(net);
        setRelocationCaps({
          Accommodation: relAcc,
          Brokerage: relBro,
          Shipment: relShp
        });
      } catch (err) {
        console.error("Failed to load policies", err);
      } finally {
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  if (loading) return <div className="p-6">Loading policies...</div>;

  const cl = user.clLevel || 'CL2'; // Fallback if not set

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <div className="pb-4 border-b border-border dark:border-slate-700 bg-gradient-to-b from-blue-50/30 dark:from-slate-800/50 to-transparent -mx-6 px-6 pt-4">
        <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100">Policy & Limits</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 dark:text-slate-400 mt-1">Showing applicable rates for {cl}</p>
      </div>

      <div className="flex flex-col gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg border-t-4 border-samsung-blue dark:border-blue-500 border-l border-r border-b border-border dark:border-slate-700 shadow-sm">
          <h2 className="font-serif text-xl font-medium text-gray-900 dark:text-gray-100 pb-2 mb-6 border-b border-border dark:border-slate-700">Domestic Travel</h2>
          
          <div className="mb-8">
            <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-slate-200">Per Diem</h3>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <td className="py-3 text-sm text-gray-600 dark:text-slate-400">Standard Rate</td>
                  <td className="py-3 text-sm font-mono font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(domRates?.[cl] || domRates?.[`${cl}/over5`] || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-slate-200">Hotel Caps by Area</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100 dark:border-slate-700 text-left text-xs font-mono uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  <th className="pb-3 pr-4">Area A+</th>
                  <th className="pb-3 pr-4">Area A</th>
                  <th className="pb-3 pr-4">Area B</th>
                  <th className="pb-3">Area C</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {domHotels?.[cl] ? domHotels[cl].map((cap, idx) => (
                    <td key={idx} className="py-4 pr-4 font-mono font-medium text-sm text-gray-900 dark:text-gray-100">
                      {cap === null ? <span className="text-gray-500 dark:text-slate-400 font-sans text-xs">Actuals (No Cap)</span> : formatCurrency(cap)}
                    </td>
                  )) : (
                    <td colSpan={4} className="py-4 text-sm text-gray-500 dark:text-slate-400">Rates not available</td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg border-t-4 border-samsung-blue dark:border-blue-500 border-l border-r border-b border-border dark:border-slate-700 shadow-sm">
          <h2 className="font-serif text-xl font-medium text-gray-900 dark:text-gray-100 pb-2 mb-6 border-b border-border dark:border-slate-700">International Travel (USD)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-slate-200">Per Diem</h3>
              <table className="w-full border-collapse">
                <tbody>
                  {['Area A', 'Area B', 'Area C'].map((area, idx) => (
                    <tr key={area} className="border-b border-gray-100 dark:border-slate-700 last:border-0">
                      <td className="py-3 text-sm text-gray-600 dark:text-slate-400">{area}</td>
                      <td className="py-3 text-sm font-mono font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(intlRates?.[cl]?.[idx] || 0, 'USD')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-slate-200">Hotel Caps</h3>
              <table className="w-full border-collapse">
                <tbody>
                  {['Area A', 'Area B', 'Area C'].map((area, idx) => (
                    <tr key={area} className="border-b border-gray-100 dark:border-slate-700 last:border-0">
                      <td className="py-3 text-sm text-gray-600 dark:text-slate-400">{area}</td>
                      <td className="py-3 text-sm font-mono font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(intlHotels?.[cl]?.[idx] || 0, 'USD')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg border-t-4 border-samsung-blue dark:border-blue-500 border-l border-r border-b border-border dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center">
            <h2 className="font-serif text-xl font-medium text-gray-900 dark:text-gray-100 pb-2 mb-4 border-b border-border dark:border-slate-700 w-full">Internet</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">Monthly Limit</p>
            <p className="font-mono text-3xl font-semibold text-gray-900 dark:text-gray-100 mt-2">{formatCurrency(internetCap?.[cl] || 0)}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg border-t-4 border-samsung-blue dark:border-blue-500 border-l border-r border-b border-border dark:border-slate-700 shadow-sm">
            <h2 className="font-serif text-xl font-medium text-gray-900 dark:text-gray-100 pb-2 mb-6 border-b border-border dark:border-slate-700">Relocation Caps</h2>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <td className="py-3 text-sm text-gray-600 dark:text-slate-400">Accommodation</td>
                  <td className="py-3 text-sm font-mono font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(relocationCaps?.Accommodation?.[cl] || 0)}</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <td className="py-3 text-sm text-gray-600 dark:text-slate-400">Brokerage</td>
                  <td className="py-3 text-sm font-mono font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(relocationCaps?.Brokerage?.[cl] || 0)}</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-slate-700">
                  <td className="py-3 text-sm text-gray-600 dark:text-slate-400">Shipment</td>
                  <td className="py-3 text-sm font-mono font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(relocationCaps?.Shipment?.[cl] || 0)}</td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-600 dark:text-slate-400">Travel</td>
                  <td className="py-3 text-sm font-mono font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wide text-xs text-right">Actuals</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
