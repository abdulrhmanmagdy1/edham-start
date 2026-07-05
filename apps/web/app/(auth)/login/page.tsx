'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserRole } from '@edham/shared-types';
import { Button, Card, ErrorText, Input } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { roleArabic } from '../../../lib/labels';

const ROLE_HOME: Record<string, string> = {
  CUSTOMER: '/customer',
  DRIVER: '/driver',
  SUPERVISOR: '/supervisor',
  ACCOUNTANT: '/accountant',
  WORKSHOP: '/workshop',
};

export default function LoginPage(): React.ReactElement {
  const { sendOtp, verifyOtp, login } = useAuth();
  const router = useRouter();

  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustomer = role === UserRole.CUSTOMER;

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

  const handleSendOtp = (): Promise<void> =>
    guard(async () => {
      await sendOtp(`+966${phone.trim()}`);
      setOtpSent(true);
    });

  const handleVerify = (): Promise<void> =>
    guard(async () => {
      const u = await verifyOtp(`+966${phone.trim()}`, otp.trim());
      router.replace(ROLE_HOME[u.role] ?? '/');
    });

  const handleLogin = (): Promise<void> =>
    guard(async () => {
      const u = await login(identifier.trim(), password);
      router.replace(ROLE_HOME[u.role] ?? '/');
    });

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-3xl font-bold text-edham-red">إدهام للوجستيات</div>
          <p className="mt-1 text-sm text-neutral-500">سجّل الدخول للمتابعة</p>
        </div>

        <div className="mb-5 flex flex-wrap justify-center gap-2">
          {Object.values(UserRole).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setOtpSent(false);
                setError(null);
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                r === role ? 'bg-edham-black text-white' : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {roleArabic(r)}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4">
            <ErrorText message={error} />
          </div>
        )}

        {isCustomer ? (
          <div className="space-y-3">
            <Input label="رقم الجوال" value={phone} onChange={setPhone} placeholder="5XXXXXXXX" />
            {otpSent && (
              <Input label="رمز التحقق (6 أرقام)" value={otp} onChange={setOtp} type="text" />
            )}
            <Button
              type="button"
              disabled={busy}
              onClick={otpSent ? handleVerify : handleSendOtp}
              className="w-full"
            >
              {busy ? '...' : otpSent ? 'تحقّق ودخول' : 'إرسال رمز التحقق'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              label="البريد الإلكتروني أو رقم الموظف"
              value={identifier}
              onChange={setIdentifier}
            />
            <Input label="كلمة المرور" value={password} onChange={setPassword} type="password" />
            <Button type="button" disabled={busy} onClick={handleLogin} className="w-full">
              {busy ? '...' : 'دخول'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
