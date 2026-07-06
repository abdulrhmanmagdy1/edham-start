'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button, ErrorText } from '../../../components/ui';
import {
  PasswordInput,
  PasswordStrength,
  passwordStrength,
  toast,
} from '../../../components/auth-ui';
import { ApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { AuthLink, AuthShell, OtpField } from '../auth-shell';

function ResetPasswordForm(): React.ReactElement {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get('id') ?? '';

  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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

  const handleReset = (): Promise<void> =>
    guard(async () => {
      if (!identifier) {
        setError('رابط غير صالح — ابدأ عملية الاستعادة من جديد.');
        return;
      }
      if (otp.length < 6) {
        setError('أدخل رمز الاستعادة المكوّن من 6 أرقام.');
        return;
      }
      if (password !== confirm) {
        setError('كلمتا المرور غير متطابقتين.');
        return;
      }
      if (!passwordStrength(password).ok) {
        setError('كلمة المرور ضعيفة: 8 أحرف على الأقل مع حرف كبير وصغير ورقم.');
        return;
      }
      await resetPassword(identifier, otp, password);
      toast('تم تحديث كلمة المرور', 'success');
      router.replace('/login');
    });

  return (
    <AuthShell title="إعادة تعيين كلمة المرور" subtitle="أدخل الرمز وكلمة المرور الجديدة">
      {error && (
        <div className="mb-4">
          <ErrorText message={error} />
        </div>
      )}

      {!identifier && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          لم يتم العثور على مُعرّف الاستعادة. ابدأ من <AuthLink href="/forgot-password">استعادة كلمة المرور</AuthLink>.
        </div>
      )}

      <div className="space-y-3">
        <OtpField label="رمز الاستعادة (6 أرقام)" value={otp} onChange={setOtp} />
        <div>
          <PasswordInput
            label="كلمة المرور الجديدة"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <PasswordStrength value={password} />
        </div>
        <PasswordInput
          label="تأكيد كلمة المرور"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
        />

        <Button type="button" disabled={busy} onClick={handleReset} className="w-full">
          {busy ? 'جارٍ...' : 'تحديث كلمة المرور'}
        </Button>

        <p className="text-center text-sm text-neutral-500">
          <AuthLink href="/login">العودة لتسجيل الدخول</AuthLink>
        </p>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <AuthShell title="إعادة تعيين كلمة المرور" subtitle="جارٍ التحميل...">
          <div className="py-8 text-center text-neutral-400">جارٍ...</div>
        </AuthShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
