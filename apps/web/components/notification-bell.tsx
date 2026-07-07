'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Notification } from '@edham/shared-types';
import { api } from '@/lib/api';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} س`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

/** جرس الإشعارات: عدّاد غير المقروء (polling) + قائمة منسدلة + تعليم كمقروء. */
export function NotificationBell(): React.ReactElement {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(async (): Promise<void> => {
    try {
      const res = await api.get<{ count: number }>('/notifications/unread-count');
      setCount(res.count);
    } catch {
      /* تجاهل بصمت */
    }
  }, []);

  const loadList = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      setItems(await api.get<Notification[]>('/notifications'));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // polling كل 30 ثانية للعدّاد
  useEffect(() => {
    void loadCount();
    const timer = setInterval(() => void loadCount(), 30000);
    return () => clearInterval(timer);
  }, [loadCount]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function onClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function toggle(): void {
    const next = !open;
    setOpen(next);
    if (next) void loadList();
  }

  async function markRead(n: Notification): Promise<void> {
    if (n.isRead) return;
    try {
      await api.patch(`/notifications/${n.id}/read`);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setCount((c) => Math.max(0, c - 1));
    } catch {
      /* تجاهل */
    }
  }

  async function markAll(): Promise<void> {
    try {
      await api.patch('/notifications/read-all');
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setCount(0);
    } catch {
      /* تجاهل */
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="الإشعارات"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-edham-red px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-20 w-80 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
            <span className="text-sm font-bold text-edham-black">الإشعارات</span>
            {items.some((i) => !i.isRead) && (
              <button onClick={() => void markAll()} className="text-xs font-medium text-edham-red hover:underline">
                تعليم الكل كمقروء
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-400">جارٍ التحميل…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-400">لا توجد إشعارات</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => void markRead(n)}
                  className={`block w-full border-b border-neutral-50 px-4 py-3 text-right transition last:border-0 hover:bg-neutral-50 ${
                    n.isRead ? 'opacity-60' : 'bg-red-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-edham-black">{n.title}</span>
                    {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-edham-red" />}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">{n.body}</p>
                  <p className="mt-1 text-[10px] text-neutral-400">{timeAgo(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
