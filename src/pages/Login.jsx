import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/shared/FormField';

export default function Login() {
  const [ghrId, setGhrId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/employee/dashboard';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-lg border border-border shadow-md w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-samsung-blue mb-1">SEM-B</h1>
          <p className="font-mono text-[18px] tracking-wide uppercase text-gray-500">Reimbursement Portal</p>
        </div>

        {error && (
          <div role="alert" className="bg-red-50 text-status-rejected p-3 rounded-md mb-6 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormField
            id="ghrId"
            label="GHR ID"
            type="text"
            value={ghrId}
            onChange={(e) => setGhrId(e.target.value)}
            required
            placeholder="e.g. 40261873"
          />

          <FormField
            id="password"
            label="Password"
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
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
