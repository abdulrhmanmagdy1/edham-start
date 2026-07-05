'use client';

import { statusColor } from '../lib/labels';

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
  className?: string;
}): React.ReactElement {
  const base = 'rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50';
  const styles: Record<string, string> = {
    primary: 'bg-edham-red text-white hover:bg-red-700',
    outline: 'border border-neutral-300 text-edham-black hover:bg-neutral-50',
    ghost: 'text-edham-black hover:bg-neutral-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-5 ${className}`}>{children}</div>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}): React.ReactElement {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-edham-red"
      />
    </label>
  );
}

export function Badge({ status, label }: { status: string; label: string }): React.ReactElement {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(status)}`}>
      {label}
    </span>
  );
}

export function Spinner(): React.ReactElement {
  return (
    <div className="flex justify-center py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-edham-red border-t-transparent" />
    </div>
  );
}

export function EmptyState({ text }: { text: string }): React.ReactElement {
  return <div className="py-16 text-center text-neutral-400">{text}</div>;
}

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-edham-black">{title}</h1>
      {action}
    </div>
  );
}

export function ErrorText({ message }: { message: string }): React.ReactElement {
  return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>;
}
