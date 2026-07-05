'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthTokens } from '@edham/shared-types';
import { api } from './api';
import { StoredUser, tokenStore } from './tokens';

interface AuthState {
  user: StoredUser | null;
  ready: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<StoredUser>;
  login: (identifier: string, password: string) => Promise<StoredUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function persist(tokens: AuthTokens): StoredUser {
  const user: StoredUser = {
    id: tokens.user.id,
    fullName: tokens.user.fullName,
    role: tokens.user.role,
  };
  tokenStore.save(tokens.accessToken, tokens.refreshToken, user);
  return user;
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(tokenStore.user);
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
      logout: (): void => {
        tokenStore.clear();
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
