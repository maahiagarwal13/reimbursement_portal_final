import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.myRequests': 'My Requests',
    'nav.newRequest': 'New Request',
    'nav.policyLimits': 'Policy & Limits',
    'nav.logout': 'Logout',
    'nav.semPortal': 'SEM Portal',
    'nav.reimbursement': 'Reimbursement',
    'nav.reviewQueue': 'Review Queue',
    'nav.financeDashboard': 'Finance Dashboard',
    'nav.allRequests': 'All Requests',
    'nav.administration': 'Administration',
    'nav.adminDashboard': 'Admin Dashboard',
    'nav.employees': 'Employees',
    'nav.policyConfig': 'Policy Config',
    'nav.domesticRates': 'Domestic Rates',
    'nav.internationalRates': 'International Rates',
    'nav.relocation': 'Relocation',
    'nav.carpooling': 'Carpooling',
    'nav.internet': 'Internet',
    'nav.footer': 'Samsung Electro-Mechanics',

    // Login
    'login.title': 'SEM-B',
    'login.subtitle': 'Reimbursement Portal',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.signIn': 'Sign in',
    'login.signingIn': 'Signing in...',

    // Dashboard
    'dashboard.welcome': 'Welcome back,',
    'dashboard.totalRequests': 'Total Requests',
    'dashboard.pendingReviews': 'Pending Reviews',
    'dashboard.approved': 'Approved',
    'dashboard.rejected': 'Rejected',
    'dashboard.recentRequests': 'Recent Requests',
    'dashboard.viewAll': 'View All',
    'dashboard.policyQuickRef': 'Policy Quick Reference',
    'dashboard.applicableLimits': 'Applicable limits for',
    'dashboard.domesticPerDiem': 'Domestic Per Diem',
    'dashboard.domesticHotel': 'Domestic Hotel (Tier A+)',
    'dashboard.intlFlight': 'International Flight',
    'dashboard.internetMonthlyCap': 'Internet Monthly Cap',
    'dashboard.carpoolDailyCap': 'Carpool Daily Cap',
    'dashboard.relocationBase': 'Relocation Base',
    'dashboard.actuals': 'Actuals',
    'dashboard.perDay': '/ day',
    'dashboard.perNight': '/ night',

    // My Requests
    'myRequests.title': 'My Requests',
    'myRequests.subtitle': 'Track and manage your submitted reimbursements',
    'myRequests.newRequest': 'New Request',
    'myRequests.noRequests': 'You have not submitted any requests yet.',
    'myRequests.loading': 'Loading requests...',

    // New Request
    'newRequest.title': 'New Reimbursement',
    'newRequest.subtitle': 'Choose a category to get started',
    'newRequest.businessTravel': 'Business Travel',
    'newRequest.travelDesc': 'Submit a travel pre-approval for domestic or international business trips.',
    'newRequest.internetBill': 'Internet Bill',
    'newRequest.internetDesc': 'Claim monthly, quarterly, or yearly internet bills for remote work.',
    'newRequest.carpool': 'Carpooling',
    'newRequest.carpoolDesc': 'Register your carpool group and claim daily commute reimbursement.',
    'newRequest.relocation': 'Relocation',
    'newRequest.relocationDesc': 'Claim relocation expenses for job transfers between cities.',

    // Pre-Approval
    'preapproval.title': 'Pre-Approval Request',
    'preapproval.domestic': 'Domestic',
    'preapproval.international': 'International',
    'preapproval.destination': 'Destination',
    'preapproval.startDate': 'Start Date',
    'preapproval.endDate': 'End Date',
    'preapproval.purpose': 'Business Purpose',
    'preapproval.travelMode': 'Preferred Mode of Travel',
    'preapproval.documents': 'Supporting Documents',
    'preapproval.submit': 'Submit Pre-Approval',
    'preapproval.saveDraft': 'Save as Draft',
    'preapproval.missingDocsDraft': 'Missing required documents. Saved as draft.',
    'preapproval.reviewNext': 'Review & Next',
    'preapproval.tripOverview': 'Trip Overview',
    'preapproval.tripType': 'Trip Type:',
    'preapproval.travelDates': 'Travel Dates:',
    'preapproval.attachedDocs': 'Attached Documents',
    'preapproval.submissionNote': 'Once submitted, you cannot modify this pre-approval request until Finance reviews it.',
    'preapproval.backToEdit': '← Back to Edit',
    'preapproval.submitting': 'Submitting...',
    'preapproval.whatYouNeed': "What you'll need",
    'preapproval.purposeDetails': 'Purpose of visit details',
    'preapproval.knoxApproval': 'Knox Approval',
    'preapproval.travelInsurance': 'Travel Insurance',
    'preapproval.visaPassport': 'Visa & Passport',
    'preapproval.missingDocsNote': 'Note: Missing documents will result in an auto-draft.',

    // Table
    'table.id': 'ID',
    'table.type': 'Type',
    'table.submitted': 'Submitted',
    'table.submittedDate': 'Submitted Date',
    'table.stage': 'Stage',
    'table.showing': 'Showing',
    'table.to': 'to',
    'table.of': 'of',
    'table.noRecords': 'No records found',
    'table.extend': 'Extend',
    'table.settle': 'Settle',

    // Common
    'common.search': 'Search...',
    'common.lightMode': 'Light Mode',
    'common.darkMode': 'Dark Mode',
    'common.cancel': 'Cancel',
    'common.loading': 'Loading...',
    'common.tryAgain': 'Try Again',
    'common.pending': 'Pending',
    'common.notUploaded': 'Not uploaded',
  },
  ko: {
    // Navigation
    'nav.dashboard': '대시보드',
    'nav.myRequests': '내 요청',
    'nav.newRequest': '새 요청',
    'nav.policyLimits': '정책 및 한도',
    'nav.logout': '로그아웃',
    'nav.semPortal': 'SEM 포털',
    'nav.reimbursement': '경비정산',
    'nav.reviewQueue': '검토 대기열',
    'nav.financeDashboard': '재무 대시보드',
    'nav.allRequests': '모든 요청',
    'nav.administration': '관리',
    'nav.adminDashboard': '관리자 대시보드',
    'nav.employees': '직원',
    'nav.policyConfig': '정책 설정',
    'nav.domesticRates': '국내 요금',
    'nav.internationalRates': '해외 요금',
    'nav.relocation': '이전',
    'nav.carpooling': '카풀',
    'nav.internet': '인터넷',
    'nav.footer': '삼성전기',

    // Login
    'login.title': 'SEM-B',
    'login.subtitle': '경비정산 포털',
    'login.username': '사용자 이름',
    'login.password': '비밀번호',
    'login.signIn': '로그인',
    'login.signingIn': '로그인 중...',

    // Dashboard
    'dashboard.welcome': '안녕하세요,',
    'dashboard.totalRequests': '총 요청',
    'dashboard.pendingReviews': '검토 대기',
    'dashboard.approved': '승인됨',
    'dashboard.rejected': '반려됨',
    'dashboard.recentRequests': '최근 요청',
    'dashboard.viewAll': '전체 보기',
    'dashboard.policyQuickRef': '정책 빠른 참조',
    'dashboard.applicableLimits': '적용 한도:',
    'dashboard.domesticPerDiem': '국내 일비',
    'dashboard.domesticHotel': '국내 호텔 (A+ 등급)',
    'dashboard.intlFlight': '해외 항공편',
    'dashboard.internetMonthlyCap': '인터넷 월 한도',
    'dashboard.carpoolDailyCap': '카풀 일일 한도',
    'dashboard.relocationBase': '이전 기본 수당',
    'dashboard.actuals': '실비',
    'dashboard.perDay': '/ 일',
    'dashboard.perNight': '/ 박',

    // My Requests
    'myRequests.title': '내 요청',
    'myRequests.subtitle': '제출한 경비청구를 추적하고 관리하세요',
    'myRequests.newRequest': '새 요청',
    'myRequests.noRequests': '아직 제출한 요청이 없습니다.',
    'myRequests.loading': '요청을 불러오는 중...',

    // New Request
    'newRequest.title': '새 경비청구',
    'newRequest.subtitle': '시작하려면 카테고리를 선택하세요',
    'newRequest.businessTravel': '출장',
    'newRequest.travelDesc': '국내 또는 해외 출장을 위한 사전 승인을 제출합니다.',
    'newRequest.internetBill': '인터넷 요금',
    'newRequest.internetDesc': '재택근무를 위한 월간, 분기별 또는 연간 인터넷 요금을 청구합니다.',
    'newRequest.carpool': '카풀',
    'newRequest.carpoolDesc': '카풀 그룹을 등록하고 일일 통근 경비를 청구합니다.',
    'newRequest.relocation': '이전',
    'newRequest.relocationDesc': '도시 간 전근에 따른 이전 비용을 청구합니다.',

    // Pre-Approval
    'preapproval.title': '사전 승인 요청',
    'preapproval.domestic': '국내',
    'preapproval.international': '해외',
    'preapproval.destination': '목적지',
    'preapproval.startDate': '시작일',
    'preapproval.endDate': '종료일',
    'preapproval.purpose': '출장 목적',
    'preapproval.travelMode': '선호 이동 수단',
    'preapproval.documents': '증빙 서류',
    'preapproval.submit': '사전 승인 제출',
    'preapproval.saveDraft': '임시 저장',
    'preapproval.missingDocsDraft': '필수 서류가 누락되어 임시 저장되었습니다.',
    'preapproval.reviewNext': '검토 및 다음',
    'preapproval.tripOverview': '출장 개요',
    'preapproval.tripType': '출장 유형:',
    'preapproval.travelDates': '출장 일정:',
    'preapproval.attachedDocs': '첨부 서류',
    'preapproval.submissionNote': '제출 후에는 재무팀이 검토할 때까지 이 사전 승인 요청을 수정할 수 없습니다.',
    'preapproval.backToEdit': '← 편집으로 돌아가기',
    'preapproval.submitting': '제출 중...',
    'preapproval.whatYouNeed': '필요한 서류',
    'preapproval.purposeDetails': '방문 목적 세부사항',
    'preapproval.knoxApproval': 'Knox 승인',
    'preapproval.travelInsurance': '여행자 보험',
    'preapproval.visaPassport': '비자 및 여권',
    'preapproval.missingDocsNote': '참고: 서류 미첨부 시 임시 저장됩니다.',

    // Table
    'table.id': 'ID',
    'table.type': '유형',
    'table.submitted': '제출일',
    'table.submittedDate': '제출 날짜',
    'table.stage': '단계',
    'table.showing': '표시 중',
    'table.to': '~',
    'table.of': '/',
    'table.noRecords': '기록이 없습니다',
    'table.extend': '연장',
    'table.settle': '정산',

    // Common
    'common.search': '검색...',
    'common.lightMode': '라이트 모드',
    'common.darkMode': '다크 모드',
    'common.cancel': '취소',
    'common.loading': '로딩 중...',
    'common.tryAgain': '다시 시도',
    'common.pending': '대기 중',
    'common.notUploaded': '미업로드',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('language') || 'en');

  useEffect(() => {
    localStorage.setItem('language', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'ko' : 'en');
  };

  const t = (key, fallback) => {
    return translations[lang]?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
