/** تخزين التوكنات في localStorage (client only). */
const ACCESS = 'edham_access';
const REFRESH = 'edham_refresh';
const ROLE = 'edham_role';
const USER = 'edham_user';

export interface StoredUser {
  id: string;
  fullName: string;
  role: string;
}

export const tokenStore = {
  get access(): string | null {
    return typeof window === 'undefined' ? null : localStorage.getItem(ACCESS);
  },
  get refresh(): string | null {
    return typeof window === 'undefined' ? null : localStorage.getItem(REFRESH);
  },
  get role(): string | null {
    return typeof window === 'undefined' ? null : localStorage.getItem(ROLE);
  },
  get user(): StoredUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  },
  save(access: string, refresh: string, user: StoredUser): void {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
    localStorage.setItem(ROLE, user.role);
    localStorage.setItem(USER, JSON.stringify(user));
  },
  setAccess(access: string): void {
    localStorage.setItem(ACCESS, access);
  },
  clear(): void {
    [ACCESS, REFRESH, ROLE, USER].forEach((k) => localStorage.removeItem(k));
  },
};
