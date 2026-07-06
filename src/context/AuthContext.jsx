import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as authServiceLogin, logout as authServiceLogout } from '../services/auth';

const AuthContext = createContext(null);

/**
 * AuthProvider — Manages user authentication state and proxy view.
 *
 * Provides:
 * - user (current employee object or null)
 * - token (JWT string or null)
 * - login(ghrId, password) — authenticates and sets user + token
 * - logout() — clears state and navigates to /login
 * - viewAsEmployee / setViewAsEmployee (Finance proxy view)
 * - isAuthenticated (boolean)
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();

  // Initialize from sessionStorage if available
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('sem_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return sessionStorage.getItem('sem_token') || null;
  });

  const [viewAsEmployee, setViewAsEmployee] = useState(null);

  const login = useCallback(
    async (ghrId, password) => {
      try {
        const { employee, token: newToken } = await authServiceLogin(ghrId, password);

        setUser(employee);
        setToken(newToken);
        sessionStorage.setItem('sem_user', JSON.stringify(employee));
        sessionStorage.setItem('sem_token', newToken);

        // Navigate based on role
        const role = employee.role;
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'finance') {
          navigate('/finance/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      } catch (err) {
        throw new Error(err.message || 'Invalid credentials');
      }
    },
    [navigate]
  );




  const logout = useCallback(async () => {
    try {
      await authServiceLogout();
    } catch {
      // Silently ignore logout API errors
    }

    setUser(null);
    setToken(null);
    setViewAsEmployee(null);
    sessionStorage.removeItem('sem_user');
    sessionStorage.removeItem('sem_token');
    navigate('/login');
  }, [navigate]);

  const isAuthenticated = useMemo(() => !!user && !!token, [user, token]);

  const contextValue = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      viewAsEmployee,
      setViewAsEmployee,
      isAuthenticated,
    }),
    [user, token, login, logout, viewAsEmployee, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — Hook to consume the AuthContext.
 * @returns {Object} Auth state and methods
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
