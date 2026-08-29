import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, api, clearAccessToken, getAccessToken, setAccessToken } from '../lib/api';
import type { Numeric, User } from '../types';

type AuthMode = 'login' | 'signup';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  authenticate: (mode: AuthMode, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<User>;
  updateBalance: (balance: Numeric) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await api.me();
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) logout();
      throw error;
    }
  }, [logout]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!getAccessToken()) {
        setInitializing(false);
        return;
      }

      try {
        const currentUser = await api.me();
        if (active) setUser(currentUser);
      } catch {
        if (active) logout();
      } finally {
        if (active) setInitializing(false);
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [logout]);

  const authenticate = useCallback(async (mode: AuthMode, email: string, password: string) => {
    const response = mode === 'login' ? await api.login(email, password) : await api.signup(email, password);
    setAccessToken(response.accessToken);
    setUser(response.user);
  }, []);

  const updateBalance = useCallback((balance: Numeric) => {
    setUser((current) => current ? { ...current, coinBalance: balance } : current);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    initializing,
    authenticate,
    logout,
    refreshUser,
    updateBalance,
  }), [authenticate, initializing, logout, refreshUser, updateBalance, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
