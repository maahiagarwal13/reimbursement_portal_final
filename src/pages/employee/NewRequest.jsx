import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plane, Wifi, Car, Truck, Clock, HelpCircle, FileX, MessageSquare, Shield, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getRateConfig } from '../../services/rateConfig';

export default function NewRequest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
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
      label: t('newRequest.businessTravel'), 
      icon: Plane, 
      route: '/new-request/travel', 
      description: t('newRequest.travelDesc'),
      meta: 'Avg. turnaround: 12 hours'
    },
    { 
      id: 'internet', 
      label: t('newRequest.internetBill'), 
      icon: Wifi, 
      route: '/new-request/internet', 
      description: t('newRequest.internetDesc'),
      meta: 'Claim once per billing cycle'
    },
    { 
      id: 'carpool', 
      label: t('newRequest.carpool'), 
      icon: Car, 
      route: '/new-request/carpool', 
      description: t('newRequest.carpoolDesc'),
      meta: 'Max ₹1,000 / day'
    },
    { 
      id: 'relocation', 
      label: t('newRequest.relocation'), 
      icon: Truck, 
      route: '/new-request/relocation', 
      description: t('newRequest.relocationDesc'),
      meta: 'One-time claim per transfer'
    },
  ];

  return (
    <div className="p-6 w-full max-w-none mx-auto flex flex-col gap-6">
      <div className="pb-4 border-b border-border dark:border-gray-700 bg-gradient-to-b from-blue-50/30 dark:from-blue-900/10 to-transparent -mx-6 px-6 pt-2 mb-2">
        <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100">{t('newRequest.title')}</h1>
        <p className="text-sm font-mono tracking-wide uppercase text-gray-500 dark:text-gray-400 mt-1">{t('newRequest.subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Request Types */}
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-6">
          {requestTypes.map(type => (
            <Link
              key={type.id}
              to={type.route}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-border dark:border-gray-700 shadow-sm hover:shadow-md hover:border-samsung-blue transition-all flex flex-col items-start gap-4 h-full relative overflow-hidden group"
            >
              <div className="w-12 h-12 rounded-md bg-blue-50 dark:bg-blue-900/30 text-samsung-blue dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <type.icon size={24} />
              </div>
              <div className="flex-1">
                <h2 className="font-serif text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">{type.label}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{type.description}</p>
              </div>
              <div className="w-full flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs font-mono uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Clock size={14} /> {type.meta}
                </span>
                <span className="text-samsung-blue dark:text-blue-400 font-medium text-sm group-hover:underline">Start →</span>
              </div>
            </Link>
          ))}


        </div>

        {/* Right Column: Reimbursement Guidelines */}
        <div className="w-full lg:w-[360px] shrink-0 bg-gray-50 dark:bg-gray-800 p-6 md:p-8 rounded-lg border border-border dark:border-gray-700">
          <h2 className="font-serif text-xl font-medium text-gray-900 dark:text-gray-100 pb-2 mb-6 border-b border-border dark:border-gray-700 flex items-center gap-2">
            <HelpCircle size={20} className="text-samsung-blue" /> Reimbursement Guidelines
          </h2>
          
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2 mb-2">
                <Clock size={16} className="text-gray-500 dark:text-gray-400" /> Standard Turnaround Times
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6 leading-relaxed">
                Pre-approvals are typically processed within 24 hours. Settlement claims take 3-5 business days post submission.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2 mb-2">
                <FileX size={16} className="text-gray-500 dark:text-gray-400" /> Missing Receipts
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6 leading-relaxed">
                If you have lost a receipt, you must attach a self-declaration document stating the amount, date, and reason for the missing receipt. Approval is subject to Finance discretion.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2 mb-2">
                <MessageSquare size={16} className="text-gray-500 dark:text-gray-400" /> Need Help?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6 leading-relaxed">
                For policy clarifications or dispute resolution, contact the Finance Helpdesk via Knox Messenger or email <a href="mailto:finance.support@example.com" className="text-samsung-blue dark:text-blue-400 hover:underline">finance.support@example.com</a>.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2 mb-2">
                <Clock size={16} className="text-gray-500 dark:text-gray-400" /> Approval Escalation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6 leading-relaxed">
                If a pre-approval or settlement remains pending for more than 3 business days, it is automatically escalated to the Regional Finance Manager.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2 mb-2">
                <Globe size={16} className="text-gray-500 dark:text-gray-400" /> Currency for International Claims
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 pl-6 leading-relaxed">
                Reimbursements are calculated in INR using the standard corporate exchange rate on the date of final submission, regardless of the billing currency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
