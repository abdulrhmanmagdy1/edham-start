'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthTokens } from '@edham/shared-types';
import { api } from './api';
import { StoredUser, tokenStore } from './tokens';

export interface SignupCustomerInput {
  companyName: string;
  commercialRegistrationNumber?: string;
  vatNumber?: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

interface AuthState {
  user: StoredUser | null;
  ready: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<StoredUser>;
  login: (identifier: string, password: string) => Promise<StoredUser>;
  signupCustomer: (input: SignupCustomerInput) => Promise<{ phone: string }>;
  verifySignupOtp: (phone: string, otp: string) => Promise<StoredUser>;
  forgotPassword: (identifier: string) => Promise<{ channel: 'phone' | 'email' }>;
  resetPassword: (identifier: string, otp: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** كوكي الدور (غير حسّاس) — ليقرأه middleware للتوجيه. الأمان الحقيقي على JWT في الـ API. */
function setRoleCookie(role: string): void {
  document.cookie = `edham_role=${role}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}
function clearRoleCookie(): void {
  document.cookie = 'edham_role=; path=/; max-age=0; samesite=lax';
}

function persist(tokens: AuthTokens): StoredUser {
  const user: StoredUser = {
    id: tokens.user.id,
    fullName: tokens.user.fullName,
    role: tokens.user.role,
  };
  tokenStore.save(tokens.accessToken, tokens.refreshToken, user);
  setRoleCookie(user.role);
  return user;
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = tokenStore.user;
    setUser(stored);
    if (stored) setRoleCookie(stored.role); // مزامنة الكوكي عند إعادة التحميل
    setReady(true);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      sendOtp: async (phone: string): Promise<void> => {
        await api.post('/auth/send-otp', { phone });
      },
      verifyOtp: async (phone: string, otp: string): Promise<StoredUser> => {
        const tokens = await api.post<AuthTokens>('/auth/verify-otp', { phone, otp });
        const u = persist(tokens);
        setUser(u);
        return u;
      },
      login: async (identifier: string, password: string): Promise<StoredUser> => {
        const tokens = await api.post<AuthTokens>('/auth/login', { identifier, password });
        const u = persist(tokens);
        setUser(u);
        return u;
      },
      signupCustomer: async (input: SignupCustomerInput): Promise<{ phone: string }> => {
        const res = await api.post<{ phone: string }>('/auth/signup-customer', input);
        return { phone: res.phone };
      },
      verifySignupOtp: async (phone: string, otp: string): Promise<StoredUser> => {
        const tokens = await api.post<AuthTokens>('/auth/verify-signup-otp', { phone, otp });
        const u = persist(tokens);
        setUser(u);
        return u;
      },
      forgotPassword: async (identifier: string): Promise<{ channel: 'phone' | 'email' }> => {
        return api.post<{ channel: 'phone' | 'email' }>('/auth/forgot-password', { identifier });
      },
      resetPassword: async (identifier: string, otp: string, newPassword: string): Promise<void> => {
        await api.post('/auth/reset-password', { identifier, otp, newPassword });
      },
      logout: (): void => {
        tokenStore.clear();
        clearRoleCookie();
        setUser(null);
      },
    }),
    [user, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
