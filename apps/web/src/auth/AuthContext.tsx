import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, api } from '../lib/api';
import type { Numeric, User } from '../types';

type AuthMode = 'login' | 'signup';
interface SignupProfile { username: string; displayName: string }

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  authenticate: (mode: AuthMode, email: string, password: string, profile?: SignupProfile) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User>;
  replaceUser: (user: User) => void;
  updateBalance: (balance: Numeric) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Local state still closes immediately if an expired session cannot be revoked.
    } finally {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await api.me();
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const currentUser = await api.me();
        if (active) setUser(currentUser);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setInitializing(false);
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const authenticate = useCallback(async (mode: AuthMode, email: string, password: string, profile?: SignupProfile) => {
    const response = mode === 'login'
      ? await api.login(email, password)
      : await api.signup({
          email,
          password,
          username: profile?.username ?? '',
          displayName: profile?.displayName ?? '',
        });
    try {
      setUser(await api.me());
    } catch {
      setUser(response.user);
    }
  }, []);

  const replaceUser = useCallback((nextUser: User) => setUser(nextUser), []);

  const updateBalance = useCallback((balance: Numeric) => {
    setUser((current) => current ? { ...current, coinBalance: balance } : current);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    initializing,
    authenticate,
    logout,
    refreshUser,
    replaceUser,
    updateBalance,
  }), [authenticate, initializing, logout, refreshUser, replaceUser, updateBalance, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
