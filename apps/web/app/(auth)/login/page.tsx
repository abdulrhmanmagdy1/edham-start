'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, ErrorText, Input } from '../../../components/ui';
import { PasswordInput, Tabs } from '../../../components/auth-ui';
import { ApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { AuthLink, AuthShell, OtpField, PhoneField } from '../auth-shell';

type Account = 'customer' | 'employee';
type CustomerMode = 'otp' | 'password';

export default function LoginPage(): React.ReactElement {
  const { sendOtp, verifyOtp, login } = useAuth();
  const router = useRouter();

  const [account, setAccount] = useState<Account>('customer');
  const [customerMode, setCustomerMode] = useState<CustomerMode>('otp');

  // عميل — OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // عميل بكلمة مرور / موظف
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetError(): void {
    setError(null);
  }

  async function guard(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setBusy(false);
    }
  }

  function goHome(role: string): void {
    router.replace('/' + role.toLowerCase());
  }

  const handleSendOtp = (): Promise<void> =>
    guard(async () => {
      await sendOtp(`+966${phone}`);
      setOtpSent(true);
    });

  const handleVerifyOtp = (): Promise<void> =>
    guard(async () => {
      const u = await verifyOtp(`+966${phone}`, otp);
      goHome(u.role);
    });

  const handlePasswordLogin = (): Promise<void> =>
    guard(async () => {
      const u = await login(email.trim(), password);
      goHome(u.role);
    });

  return (
    <AuthShell title="تسجيل الدخول" subtitle="أدخل بياناتك للوصول إلى حسابك">
      <div className="mb-5">
        <Tabs
          active={account}
          onChange={(k) => {
            setAccount(k as Account);
            resetError();
          }}
          tabs={[
            { key: 'customer', label: 'عميل' },
            { key: 'employee', label: 'موظف' },
          ]}
        />
      </div>

      {error && (
        <div className="mb-4">
          <ErrorText message={error} />
        </div>
      )}

      {account === 'customer' ? (
        <div className="space-y-4">
          <Tabs
            active={customerMode}
            onChange={(k) => {
              setCustomerMode(k as CustomerMode);
              resetError();
            }}
            tabs={[
              { key: 'otp', label: 'برمز التحقق' },
              { key: 'password', label: 'بكلمة المرور' },
            ]}
          />

          {customerMode === 'otp' ? (
            <div className="space-y-3">
              <PhoneField label="رقم الجوال" value={phone} onChange={setPhone} />
              {otpSent && (
                <>
                  <OtpField label="رمز التحقق (6 أرقام)" value={otp} onChange={setOtp} />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={busy}
                    className="text-xs font-medium text-neutral-500 hover:text-edham-red disabled:opacity-50"
                  >
                    إعادة إرسال الرمز
                  </button>
                </>
              )}
              <Button
                type="button"
                disabled={busy || (otpSent ? otp.length < 6 : phone.length < 9)}
                onClick={otpSent ? handleVerifyOtp : handleSendOtp}
                className="w-full"
              >
                {busy ? 'جارٍ...' : otpSent ? 'تسجيل الدخول' : 'إرسال رمز التحقق'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                label="البريد الإلكتروني"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="you@company.com"
              />
              <PasswordInput
                label="كلمة المرور"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
              <Button
                type="button"
                disabled={busy || !email.trim() || !password}
                onClick={handlePasswordLogin}
                className="w-full"
              >
                {busy ? 'جارٍ...' : 'تسجيل الدخول'}
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-neutral-500">
            ليس لديك حساب؟ <AuthLink href="/signup">سجّل الآن</AuthLink>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            label="البريد الإلكتروني"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@edham.sa"
          />
          <PasswordInput
            label="كلمة المرور"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 accent-edham-red"
              />
              تذكّرني
            </label>
            <AuthLink href="/forgot-password">نسيت كلمة المرور؟</AuthLink>
          </div>

          <Button
            type="button"
            disabled={busy || !email.trim() || !password}
            onClick={handlePasswordLogin}
            className="w-full"
          >
            {busy ? 'جارٍ...' : 'تسجيل الدخول'}
          </Button>

          <p className="text-center text-xs text-neutral-400">
            الحسابات الموظفة تُنشأ من إدارة إدهام.
          </p>
        </div>
      )}
    </AuthShell>
  );
}
