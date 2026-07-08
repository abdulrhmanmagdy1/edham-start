'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { roleArabic } from '../lib/labels';
import { NotificationBell } from './notification-bell';
import { Spinner } from './ui';

export interface NavItem {
  href: string;
  label: string;
}

/** هيكل لوحة التحكم: قائمة جانبية (RTL يمين) + شريط علوي. يفرض الدور المطلوب. */
export function DashboardShell({
  role,
  nav,
  children,
}: {
  role: string;
  nav: NavItem[];
  children: React.ReactNode;
}): React.ReactElement {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (ready && (!user || user.role !== role)) router.replace('/login');
  }, [ready, user, role, router]);

  function handleLogout(): void {
    logout();
    router.replace('/login');
  }

  if (!ready || !user) return <Spinner />;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden w-64 flex-col border-l border-neutral-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-4">
          <span className="text-lg font-bold text-edham-red">إدهام</span>
          <span className="text-sm text-neutral-400">| {roleArabic(role)}</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  active ? 'bg-edham-black text-white' : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
          <div className="text-sm text-neutral-500">{user.fullName || roleArabic(role)}</div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <button onClick={handleLogout} className="text-sm font-medium text-edham-red hover:underline">
              تسجيل الخروج
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}
