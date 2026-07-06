'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, ErrorText, Input } from '../../../components/ui';
import { Tabs } from '../../../components/auth-ui';
import { ApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { AuthLink, AuthShell, PhoneField } from '../auth-shell';

type Method = 'phone' | 'email';
type Step = 'request' | 'sent';

export default function ForgotPasswordPage(): React.ReactElement {
  const { forgotPassword } = useAuth();
  const router = useRouter();

  const [method, setMethod] = useState<Method>('phone');
  const [step, setStep] = useState<Step>('request');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleRequest = (): Promise<void> =>
    guard(async () => {
      const id = method === 'phone' ? `+966${phone}` : email.trim();
      if (method === 'phone' ? phone.length < 9 : !email.trim()) {
        setError('يرجى إدخال بيانات صحيحة.');
        return;
      }
      await forgotPassword(id);
      setIdentifier(id);
      setStep('sent');
    });

  return (
    <AuthShell
      title="استعادة كلمة المرور"
      subtitle={
        step === 'request'
          ? 'اختر طريقة الاستعادة وسنرسل لك رمزاً'
          : 'تحقق من وسيلة الاتصال التي اخترتها'
      }
    >
      {error && (
        <div className="mb-4">
          <ErrorText message={error} />
        </div>
      )}

      {step === 'request' ? (
        <div className="space-y-4">
          <Tabs
            active={method}
            onChange={(k) => {
              setMethod(k as Method);
              setError(null);
            }}
            tabs={[
              { key: 'phone', label: 'بالجوال' },
              { key: 'email', label: 'بالإيميل' },
            ]}
          />

          {method === 'phone' ? (
            <PhoneField label="رقم الجوال" value={phone} onChange={setPhone} />
          ) : (
            <Input
              label="البريد الإلكتروني"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="you@company.com"
            />
          )}

          <Button type="button" disabled={busy} onClick={handleRequest} className="w-full">
            {busy ? 'جارٍ...' : 'إرسال رمز الاستعادة'}
          </Button>

          <p className="text-center text-sm text-neutral-500">
            تذكّرت كلمة المرور؟ <AuthLink href="/login">العودة لتسجيل الدخول</AuthLink>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            تم إرسال رمز الاستعادة — افحص {method === 'phone' ? 'جوالك' : 'بريدك الإلكتروني'}.
          </div>

          <Button
            type="button"
            onClick={() => router.push(`/reset-password?id=${encodeURIComponent(identifier)}`)}
            className="w-full"
          >
            متابعة لإعادة التعيين
          </Button>

          <p className="text-center text-sm text-neutral-500">
            <AuthLink href="/login">العودة لتسجيل الدخول</AuthLink>
          </p>
        </div>
      )}
    </AuthShell>
  );
}
