import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getRequestsByEmployee } from '../../services/requests';
import DataTable from '../../components/shared/DataTable';
import Badge from '../../components/shared/Badge';
import Toast from '../../components/shared/Toast';
import { formatDate } from '../../utils/formatters';

export default function MyRequests() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (location.state?.toastMessage) {
      setToast({ visible: true, message: location.state.toastMessage, type: location.state.toastType || 'success' });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await getRequestsByEmployee(user.ghrId);
        
        // Inject local drafts
        const localDrafts = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('draft_')) {
            const parts = key.split('_');
            if (parts.length >= 3 && parts[1] !== 'settlement') {
              const type = parts[1];
              const id = parts.slice(2).join('_');
              const requestType = type === 'internet' ? 'internet-bill' : type;
              localDrafts.push({
                id: id === 'new' ? `Local-Draft` : id,
                type: requestType,
                stage: 'draft',
                submittedAt: new Date().toISOString(),
                draftId: id
              });
            }
          }
        }
        
        setRequests([...data, ...localDrafts].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)));
      } catch (err) {
        console.error("Failed to load requests", err);
        setError(err.message || "Failed to load requests");
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      loadRequests();
    }
  }, [user]);

  if (loading) {
    return <div className="p-6 dark:text-gray-300">{t('myRequests.loading')}</div>;
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-samsung-blue text-white rounded-md hover:bg-blue-700"
        >
          {t('common.tryAgain')}
        </button>
      </div>
    );
  }

  const columns = [
    { key: 'id', label: t('table.id'), isNumeric: true, render: (val) => val.slice(0,8) },
    { key: 'type', label: t('table.type'), render: (val) => val.charAt(0).toUpperCase() + val.slice(1) },
    { key: 'submittedAt', label: t('table.submittedDate'), isNumeric: true, render: (val) => formatDate(val) },
    { 
      key: 'stage', 
      label: t('table.stage'), 
      render: (val, row) => {
        let status = 'pending';
        if (row.stage === 'draft') status = 'draft';
        else if (row.stage === 'pre-approval' && row.preApprovalStatus === 'approved') status = 'approved';
        else if (row.stage === 'pre-approval' && row.preApprovalStatus === 'rejected') status = 'rejected';
        else if (row.stage === 'settlement' && row.settlementStatus === 'approved') status = 'approved';
        else if (row.stage === 'settlement' && row.settlementStatus === 'rejected') status = 'rejected';
        return <Badge status={status}>{val}</Badge>;
      } 
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => {
        if (row.type === 'travel' && row.stage === 'pre-approval' && row.preApprovalStatus === 'approved' && !row.settlement) {
          return (
            <div className="flex gap-2 justify-end">
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/new-request/travel/extend/${row.id}`); }}
                className="text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-border dark:border-gray-600 px-3 py-1.5 rounded font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
              >
                {t('table.extend')}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/requests/${row.id}/settlement`); }}
                className="text-xs bg-samsung-blue text-white px-3 py-1.5 rounded font-medium hover:bg-blue-800 focus:outline-none"
              >
                {t('table.settle')}
              </button>
            </div>
          );
        }
        return null;
      }
    }
  ];

  return (
    <div className="p-6 w-full max-w-none mx-auto flex flex-col gap-8">
      {/* Page Header */}
      <div className="pb-6 border-b border-border dark:border-gray-700 bg-gradient-to-b from-blue-50/30 dark:from-blue-900/10 to-transparent -mx-6 px-6 pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100">{t('myRequests.title')}</h1>
          <p className="text-sm font-mono tracking-wide uppercase text-gray-500 dark:text-gray-400 mt-1">{t('myRequests.subtitle')}</p>
        </div>
        <button 
          onClick={() => navigate('/new-request')}
          className="bg-samsung-blue text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue w-full sm:w-auto text-center"
        >
          {t('myRequests.newRequest')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-md border border-border dark:border-slate-700 overflow-hidden">
        <DataTable 
          columns={columns} 
          data={requests} 
          emptyMessage={t('myRequests.noRequests')}
          onRowClick={(row) => {
            if (row.stage === 'draft') {
              const dId = row.draftId || row.id;
              if (row.type === 'travel') navigate(`/new-request/travel?draftId=${dId}`);
              else if (row.type === 'internet-bill') navigate(`/new-request/internet?draftId=${dId}`);
              else if (row.type === 'carpool') navigate(`/new-request/carpool?draftId=${dId}`);
              else if (row.type === 'relocation') navigate(`/new-request/relocation?draftId=${dId}`);
            } else {
              navigate(`/requests/${row.id}`);
            }
          }}
        />
      </div>
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({...toast, visible: false})} />
    </div>
  );
}
