import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plane, Wifi, Car, Truck, Clock, HelpCircle, FileX, MessageSquare, Shield, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRateConfig } from '../../services/rateConfig';

export default function NewRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [policyRates, setPolicyRates] = useState(null);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const cl = user.clLevel || 'CL3';
        const [domesticPerDiem, domesticHotel, internetCap, carpoolCap, relocation] = await Promise.all([
          getRateConfig('domesticPerDiem'),
          getRateConfig('domesticHotel'),
          getRateConfig('internetCap'),
          getRateConfig('carpool'),
          getRateConfig('relocation')
        ]);
        
        let perDiemRate = cl === 'CL3' ? domesticPerDiem?.rates?.['CL3']?.['under5']?.value : domesticPerDiem?.rates?.[cl]?.value;
        if (!perDiemRate) perDiemRate = domesticPerDiem?.rates?.['CL3']?.['under5']?.value;
        
        let hotelRate = cl === 'CL3' ? domesticHotel?.rates?.['CL3']?.['under5']?.[0] : domesticHotel?.rates?.[cl]?.[0];
        if (hotelRate === undefined) hotelRate = domesticHotel?.rates?.['CL3']?.['under5']?.[0];

        let intCap = internetCap?.rates?.[cl]?.value || 1500;

        setPolicyRates({
          perDiem: perDiemRate,
          hotelCap: hotelRate,
          internet: intCap,
          carpool: carpoolCap?.dailyCap || 1000,
          relocationBase: relocation?.baseAllowance || 50000
        });
      } catch (err) {
        console.error("Failed to load policy rates", err);
      }
    }
    if (user) loadPolicies();
  }, [user]);

  const requestTypes = [
    { 
      id: 'travel', 
      label: 'Business Travel', 
      icon: Plane, 
      route: '/new-request/travel', 
      description: 'Submit a travel pre-approval for domestic or international business trips.',
      meta: 'Avg. turnaround: 12 hours'
    },
    { 
      id: 'internet', 
      label: 'Internet Bill', 
      icon: Wifi, 
      route: '/new-request/internet', 
      description: 'Claim monthly, quarterly, or yearly internet bills for remote work.',
      meta: 'Claim once per billing cycle'
    },
    { 
      id: 'carpool', 
      label: 'Carpool', 
      icon: Car, 
      route: '/new-request/carpool', 
      description: 'Reimbursement for commuting to the office via own vehicle or rented cab.',
      meta: 'Max ₹1,000 / day'
    },
    { 
      id: 'relocation', 
      label: 'Relocation', 
      icon: Truck, 
      route: '/new-request/relocation', 
      description: 'Claim relocation expenses such as accommodation, brokerage, and shipment.',
      meta: 'One-time claim per transfer'
    },
  ];

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
      <div className="pb-4 border-b border-border bg-gradient-to-b from-blue-50/30 to-transparent -mx-6 px-6 pt-2 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-gray-900">New Reimbursement Request</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 mt-1">Select the type of expense you are claiming</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Request Types */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {requestTypes.map(type => (
            <Link
              key={type.id}
              to={type.route}
              className="bg-white p-6 rounded-lg border border-border shadow-sm hover:shadow-md hover:border-samsung-blue transition-all flex flex-col items-start gap-4 h-full relative overflow-hidden group"
            >
              <div className="w-12 h-12 rounded-md bg-blue-50 text-samsung-blue flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <type.icon size={24} />
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-xl font-medium text-gray-900 mb-2">{type.label}</h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{type.description}</p>
              </div>
              <div className="w-full flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <span className="text-xs font-mono uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                  <Clock size={14} /> {type.meta}
                </span>
                <span className="text-samsung-blue font-medium text-sm group-hover:underline">Start →</span>
              </div>
            </Link>
          ))}

          {/* Policy Quick Reference (Full Width under cards) */}
          {policyRates && (
            <div className="col-span-1 md:col-span-2 mt-4 bg-white rounded-lg border border-border shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-border flex items-center gap-2">
                <Shield size={18} className="text-samsung-blue" />
                <h3 className="text-sm font-semibold text-gray-900 m-0">Policy Quick Reference ({user.clLevel || 'CL3'})</h3>
              </div>
              <div className="p-0">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-gray-700 w-1/2">Domestic Per Diem</td>
                      <td className="px-6 py-3.5 font-mono text-gray-900 w-1/2">₹{policyRates.perDiem} / day</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-gray-700 w-1/2">Domestic Hotel (Tier A+)</td>
                      <td className="px-6 py-3.5 font-mono text-gray-900 w-1/2">{policyRates.hotelCap === null ? 'Actuals' : `₹${policyRates.hotelCap} / night`}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-gray-700 w-1/2">International Flight</td>
                      <td className="px-6 py-3.5 font-mono text-gray-500 uppercase tracking-wide text-xs w-1/2">Actuals</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-gray-700 w-1/2">Internet Monthly Cap</td>
                      <td className="px-6 py-3.5 font-mono text-gray-900 w-1/2">₹{policyRates.internet}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-gray-700 w-1/2">Carpool Daily Cap</td>
                      <td className="px-6 py-3.5 font-mono text-gray-900 w-1/2">₹{policyRates.carpool}</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-gray-700 w-1/2">Relocation Base</td>
                      <td className="px-6 py-3.5 font-mono text-gray-900 w-1/2">₹{policyRates.relocationBase.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Reimbursement Guidelines */}
        <div className="lg:col-span-4 bg-gray-50 p-6 md:p-8 rounded-lg border border-border">
          <h2 className="font-serif text-xl font-medium text-gray-900 pb-2 mb-6 border-b border-border flex items-center gap-2">
            <HelpCircle size={20} className="text-samsung-blue" /> Reimbursement Guidelines
          </h2>
          
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <Clock size={16} className="text-gray-500" /> Standard Turnaround Times
              </h3>
              <p className="text-sm text-gray-600 pl-6 leading-relaxed">
                Pre-approvals are typically processed within 24 hours. Settlement claims take 3-5 business days post submission.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <FileX size={16} className="text-gray-500" /> Missing Receipts
              </h3>
              <p className="text-sm text-gray-600 pl-6 leading-relaxed">
                If you have lost a receipt, you must attach a self-declaration document stating the amount, date, and reason for the missing receipt. Approval is subject to Finance discretion.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-gray-500" /> Need Help?
              </h3>
              <p className="text-sm text-gray-600 pl-6 leading-relaxed">
                For policy clarifications or dispute resolution, contact the Finance Helpdesk via Knox Messenger or email <a href="mailto:finance.support@example.com" className="text-samsung-blue hover:underline">finance.support@example.com</a>.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <Clock size={16} className="text-gray-500" /> Approval Escalation
              </h3>
              <p className="text-sm text-gray-600 pl-6 leading-relaxed">
                If a pre-approval or settlement remains pending for more than 3 business days, it is automatically escalated to the Regional Finance Manager.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <Globe size={16} className="text-gray-500" /> Currency for International Claims
              </h3>
              <p className="text-sm text-gray-600 pl-6 leading-relaxed">
                Reimbursements are calculated in INR using the standard corporate exchange rate on the date of final submission, regardless of the billing currency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
