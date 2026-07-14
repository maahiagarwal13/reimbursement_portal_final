import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import FormField from '../components/shared/FormField';
import { Moon, Sun, Globe } from 'lucide-react';

export default function Login() {
  const [ghrId, setGhrId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t, lang, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(ghrId, password);
      navigate(from === '/login' ? '/' : from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      {/* Theme & Language toggles */}
      <div className="fixed top-4 right-4 flex items-center gap-3 z-50">
        <button 
          onClick={toggleTheme} 
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-samsung-blue dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button 
          onClick={toggleLanguage} 
          className="flex items-center gap-1 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-samsung-blue dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm"
          title="Toggle Language"
        >
          <Globe size={18} />
          <span className="uppercase">{lang}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-border dark:border-gray-700 shadow-md w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-samsung-blue mb-1">{t('login.title')}</h1>
          <p className="font-mono text-[18px] tracking-wide uppercase text-gray-500 dark:text-gray-400">{t('login.subtitle')}</p>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/30 text-status-rejected p-3 rounded-md mb-6 text-sm font-medium border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormField
            id="ghrId"
            label={t('login.username')}
            type="text"
            value={ghrId}
            onChange={(e) => setGhrId(e.target.value)}
            required
            placeholder="e.g. emp001"
          />

          <FormField
            id="password"
            label={t('login.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 bg-samsung-blue text-white rounded-md text-sm font-medium hover:bg-blue-800 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-samsung-blue"
          >
            {isLoading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
