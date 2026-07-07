'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { config } from '@/lib/config';

/**
 * قشرة split-screen مشتركة لكل صفحات المصادقة.
 * عمود البراندينج يظهر على md+ فقط، عمود النموذج دائماً ظاهر. RTL.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* عمود البراندينج — md+ فقط */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-edham-black p-10 text-white md:flex lg:w-[45%]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-edham-red/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-edham-red/20 blur-3xl"
        />

        <div className="relative">
          <div className="text-3xl font-bold">
            إدهام <span className="text-edham-red">للوجستيات</span>
          </div>
        </div>

        <div className="relative max-w-sm">
          <h2 className="text-2xl font-bold leading-relaxed">
            منظومة لوجستية متكاملة لسلسلة التبريد والنقل
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            تتبّع حي، تسعير احترافي، وإدارة كاملة للأسطول — كل ذلك من منصة واحدة تخدم
            العميل والسائق والمشرف والمحاسب والورشة.
          </p>
        </div>

        <div className="relative text-xs text-white/50">© إدهام للوجستيات — جميع الحقوق محفوظة</div>
      </aside>

      {/* عمود النموذج */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center md:hidden">
            <div className="text-2xl font-bold text-edham-red">إدهام للوجستيات</div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-edham-black">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

/** يطبّع رقم جوال سعودي إلى صيغة 5XXXXXXXX (يزيل 966/0 الزائدة). */
export function normalizeSaudiPhone(raw: string): string {
  let v = raw.replace(/\D/g, '');
  if (v.startsWith('966')) v = v.slice(3);
  if (v.startsWith('0')) v = v.slice(1);
  return v.slice(0, 9);
}

/** يتحقق أن الرقم بصيغة 5 + 8 أرقام. */
export function isValidSaudiPhone(v: string): boolean {
  return /^5\d{8}$/.test(v);
}

/** حقل جوال سعودي: بادئة ثابتة +966 + تطبيع تلقائي (يخزّن 5XXXXXXXX). */
export function PhoneField({
  label,
  value,
  onChange,
  autoComplete = 'tel',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}): React.ReactElement {
  const invalid = value.length > 0 && !isValidSaudiPhone(value);
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      <div
        dir="ltr"
        className={`flex items-stretch overflow-hidden rounded-lg border ${
          invalid ? 'border-edham-red' : 'border-neutral-300'
        } focus-within:border-edham-red`}
      >
        <span className="flex select-none items-center bg-neutral-100 px-3 text-sm font-medium text-neutral-600">
          +966
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          value={value}
          placeholder="5XXXXXXXX"
          aria-label={label}
          maxLength={9}
          onChange={(e) => onChange(normalizeSaudiPhone(e.target.value))}
          className="w-full px-3 py-2.5 text-left outline-none"
        />
      </div>
      <span className={`mt-1 block text-xs ${invalid ? 'text-edham-red' : 'text-neutral-400'}`}>
        {invalid ? 'يجب أن يبدأ بـ 5 ويتكوّن من 9 أرقام (مثال: 512345678)' : 'أدخل 9 أرقام تبدأ بـ 5'}
      </span>
    </label>
  );
}

/** تلميح رمز التحقق في وضع التجربة فقط (config.demoMode). */
function DemoOtpHint({ phone }: { phone?: string }): React.ReactElement | null {
  const [otp, setOtp] = useState<string | null>(null);

  useEffect(() => {
    if (!config.demoMode || !phone) return;
    let active = true;
    api
      .get<{ otp: string | null }>(`/auth/demo/otp?phone=${encodeURIComponent(phone)}`)
      .then((r) => {
        if (active) setOtp(r.otp);
      })
      .catch(() => {
        /* تجاهل */
      });
    return () => {
      active = false;
    };
  }, [phone]);

  if (!config.demoMode || !otp) return null;
  return (
    <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-center text-sm text-amber-800">
      رمز التجربة: <span className="font-bold tracking-widest">{otp}</span>
    </div>
  );
}

/** حقل رمز تحقق من 6 أرقام. */
export function OtpField({
  label,
  value,
  onChange,
  phone,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** لعرض رمز التجربة تلقائياً في وضع العرض (اختياري). */
  phone?: string;
}): React.ReactElement {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        placeholder="------"
        aria-label={label}
        maxLength={6}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:border-edham-red"
      />
      <DemoOtpHint phone={phone} />
    </label>
  );
}

/** رابط تنقّل بنمط موحّد أسفل النماذج. */
export function AuthLink({ href, children }: { href: string; children: React.ReactNode }): React.ReactElement {
  return (
    <Link href={href} className="font-semibold text-edham-red hover:underline">
      {children}
    </Link>
  );
}
