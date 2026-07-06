'use client';

import { useEffect, useState } from 'react';

// ── Tabs ──
export interface TabItem {
  key: string;
  label: string;
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}): React.ReactElement {
  return (
    <div className="flex rounded-xl bg-neutral-100 p-1">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-selected={on}
            role="tab"
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              on ? 'bg-white text-edham-black shadow-sm' : 'text-neutral-500 hover:text-edham-black'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── PasswordInput (show/hide) ──
export function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}): React.ReactElement {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 pl-16 outline-none focus:border-edham-red"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 left-2 my-auto h-fit text-xs font-medium text-neutral-500 hover:text-edham-red"
          aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
        >
          {show ? 'إخفاء' : 'إظهار'}
        </button>
      </div>
    </label>
  );
}

// ── Password strength ──
export interface Strength {
  score: number; // 0..4
  label: string;
  ok: boolean; // 8+ upper+lower+digit
}

export function passwordStrength(pw: string): Strength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  const ok = pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw);
  const labels = ['ضعيفة جداً', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية'];
  return { score, label: labels[score] ?? 'ضعيفة جداً', ok };
}

export function PasswordStrength({ value }: { value: string }): React.ReactElement | null {
  if (!value) return null;
  const s = passwordStrength(value);
  const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-600'];
  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < s.score ? colors[s.score] : 'bg-neutral-200'}`}
          />
        ))}
      </div>
      <span className="mt-1 block text-xs text-neutral-500">قوة كلمة المرور: {s.label}</span>
    </div>
  );
}

// ── Toast (pub-sub) ──
type ToastType = 'success' | 'error' | 'info';
interface ToastMsg {
  id: number;
  message: string;
  type: ToastType;
}

let counter = 0;
const listeners = new Set<(t: ToastMsg) => void>();

export function toast(message: string, type: ToastType = 'info'): void {
  const t: ToastMsg = { id: ++counter, message, type };
  listeners.forEach((l) => l(t));
}

export function Toaster(): React.ReactElement {
  const [items, setItems] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const onToast = (t: ToastMsg): void => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3500);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  const bg: Record<ToastType, string> = {
    success: 'bg-green-600',
    error: 'bg-edham-red',
    info: 'bg-edham-black',
  };

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2">
      {items.map((t) => (
        <div key={t.id} className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${bg[t.type]}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
