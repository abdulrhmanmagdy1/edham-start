'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, ErrorText, Input } from '../../../components/ui';
import { PasswordInput, PasswordStrength, passwordStrength } from '../../../components/auth-ui';
import { ApiError } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { AuthLink, AuthShell, isValidSaudiPhone, OtpField, PhoneField } from '../auth-shell';

type Step = 'form' | 'otp';

export default function SignupPage(): React.ReactElement {
  const { signupCustomer, verifySignupOtp } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('form');

  const [companyName, setCompanyName] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);

  const [otp, setOtp] = useState('');
  const [otpPhone, setOtpPhone] = useState('');

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

  const handleSignup = (): Promise<void> =>
    guard(async () => {
      if (!companyName.trim() || !fullName.trim() || !email.trim()) {
        setError('يرجى تعبئة كل الحقول المطلوبة (*).');
        return;
      }
      if (!isValidSaudiPhone(phone)) {
        setError('رقم الجوال يجب أن يبدأ بـ 5 ويتكوّن من 9 أرقام (مثال: 512345678).');
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
      if (!agree) {
        setError('يجب الموافقة على الشروط والأحكام للمتابعة.');
        return;
      }
      const res = await signupCustomer({
        companyName: companyName.trim(),
        commercialRegistrationNumber: crNumber.trim() || undefined,
        vatNumber: vatNumber.trim() || undefined,
        fullName: fullName.trim(),
        phone: `+966${phone}`,
        email: email.trim(),
        password,
      });
      setOtpPhone(res.phone);
      setStep('otp');
    });

  const handleVerify = (): Promise<void> =>
    guard(async () => {
      await verifySignupOtp(otpPhone, otp);
      router.replace('/customer');
    });

  return (
    <AuthShell
      title={step === 'form' ? 'إنشاء حساب عميل' : 'تأكيد رقم الجوال'}
      subtitle={
        step === 'form'
          ? 'سجّل شركتك للبدء في طلب خدمات النقل'
          : `أدخل رمز التحقق المُرسَل إلى ${otpPhone}`
      }
    >
      {error && (
        <div className="mb-4">
          <ErrorText message={error} />
        </div>
      )}

      {step === 'form' ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-edham-red/30 bg-red-50 px-4 py-3 text-sm text-red-700">
            التسجيل متاح للعملاء (الشركات) فقط. باقي الأدوار تُنشأ من إدارة إدهام.
          </div>

          <Input label="اسم الشركة *" value={companyName} onChange={setCompanyName} />
          <Input
            label="السجل التجاري (اختياري)"
            value={crNumber}
            onChange={setCrNumber}
            placeholder="10XXXXXXXX"
          />
          <Input
            label="الرقم الضريبي (اختياري)"
            value={vatNumber}
            onChange={setVatNumber}
            placeholder="3XXXXXXXXXXXXXX"
          />
          <Input label="الاسم الكامل *" value={fullName} onChange={setFullName} />
          <PhoneField label="رقم الجوال *" value={phone} onChange={setPhone} />
          <Input
            label="البريد الإلكتروني *"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@company.com"
          />
          <div>
            <PasswordInput
              label="كلمة المرور *"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
            <PasswordStrength value={password} />
          </div>
          <PasswordInput
            label="تأكيد كلمة المرور *"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          />

          <label className="flex items-start gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-edham-red"
            />
            <span>أوافق على الشروط والأحكام وسياسة الخصوصية.</span>
          </label>

          <Button type="button" disabled={busy} onClick={handleSignup} className="w-full">
            {busy ? 'جارٍ...' : 'إنشاء حساب'}
          </Button>

          <p className="text-center text-sm text-neutral-500">
            لديك حساب بالفعل؟ <AuthLink href="/login">تسجيل الدخول</AuthLink>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <OtpField label="رمز التحقق (6 أرقام)" value={otp} onChange={setOtp} />
          <Button
            type="button"
            disabled={busy || otp.length < 6}
            onClick={handleVerify}
            className="w-full"
          >
            {busy ? 'جارٍ...' : 'تأكيد وإنشاء الحساب'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep('form');
              setError(null);
            }}
            className="w-full text-center text-sm text-neutral-500 hover:text-edham-red"
          >
            تعديل البيانات
          </button>
        </div>
      )}
    </AuthShell>
  );
}
