'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import {
  Button,
  Card,
  Input,
  Spinner,
  ErrorText,
  PageHeader,
  Badge,
  EmptyState,
} from '@/components/ui';
import { roleArabic } from '@/lib/labels';
import { UserRole, UserStatus } from '@edham/shared-types';
import type { User } from '@edham/shared-types';

const selectClass =
  'w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-edham-red';

/** الأدوار القابلة للإنشاء من قِبل المشرف (الموظفون فقط — لا عملاء) */
const CREATABLE_ROLES: UserRole[] = [
  UserRole.DRIVER,
  UserRole.ACCOUNTANT,
  UserRole.WORKSHOP,
  UserRole.SUPERVISOR,
];

function userStatusArabic(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'نشط',
    INACTIVE: 'معطّل',
    SUSPENDED: 'موقوف',
  };
  return map[status] ?? status;
}

function AddUserForm({ onDone }: { onDone: () => void }): React.ReactElement {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.DRIVER);
  const [employeeId, setEmployeeId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isDriver = role === UserRole.DRIVER;

  async function submit(): Promise<void> {
    setErr(null);
    if (
      fullName.trim() === '' ||
      phone.trim() === '' ||
      email.trim() === '' ||
      password.trim() === ''
    ) {
      setErr('أكمل الاسم والجوال والبريد وكلمة المرور');
      return;
    }
    if (password.trim().length < 8) {
      setErr('كلمة المرور 8 أحرف على الأقل');
      return;
    }
    if (isDriver && (employeeId.trim() === '' || licenseNumber.trim() === '' || licenseExpiry === '')) {
      setErr('أكمل الرقم الوظيفي ورقم الرخصة وتاريخ انتهائها للسائق');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        role,
        password: password.trim(),
      };
      if (isDriver) {
        body.employeeId = employeeId.trim();
        body.licenseNumber = licenseNumber.trim();
        body.licenseExpiry = new Date(licenseExpiry).toISOString();
      }
      await api.post<User>('/users', body);
      onDone();
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-bold text-edham-black">إضافة موظف</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="الاسم الكامل" value={fullName} onChange={setFullName} />
        <Input label="رقم الجوال" value={phone} onChange={setPhone} placeholder="+9665XXXXXXXX" />
        <Input label="البريد الإلكتروني" type="email" value={email} onChange={setEmail} />
        <Input label="كلمة المرور" type="password" value={password} onChange={setPassword} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">الدور</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={selectClass}
          >
            {CREATABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleArabic(r)}
              </option>
            ))}
          </select>
        </label>
        {isDriver && (
          <>
            <Input label="الرقم الوظيفي" value={employeeId} onChange={setEmployeeId} />
            <Input label="رقم الرخصة" value={licenseNumber} onChange={setLicenseNumber} />
            <Input
              label="تاريخ انتهاء الرخصة"
              type="date"
              value={licenseExpiry}
              onChange={setLicenseExpiry}
            />
          </>
        )}
      </div>
      {err && (
        <div className="mt-4">
          <ErrorText message={err} />
        </div>
      )}
      <div className="mt-4">
        <Button type="button" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'جارٍ الحفظ…' : 'حفظ الموظف'}
        </Button>
      </div>
    </Card>
  );
}

function UserRow({ user, onChanged }: { user: User; onChanged: () => void }): React.ReactElement {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isActive = user.status === UserStatus.ACTIVE;

  async function toggle(): Promise<void> {
    setErr(null);
    setBusy(true);
    try {
      await api.patch<User>(`/users/${user.id}/status`, {
        status: isActive ? UserStatus.INACTIVE : UserStatus.ACTIVE,
      });
      onChanged();
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-edham-black">{user.fullName}</p>
          <p className="truncate text-sm text-neutral-500">
            {roleArabic(user.role)} · {user.phone}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={user.status} label={userStatusArabic(user.status)} />
          <Button variant="outline" onClick={() => void toggle()} disabled={busy}>
            {busy ? '…' : isActive ? 'تعطيل' : 'تفعيل'}
          </Button>
        </div>
      </div>
      {err && (
        <div className="mt-3">
          <ErrorText message={err} />
        </div>
      )}
    </li>
  );
}

export default function SupervisorUsersPage(): React.ReactElement {
  const { data, loading, error, refetch } = useQuery<User[]>(() => api.get<User[]>('/users'), []);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <PageHeader
        title="المستخدمون"
        action={
          <Button variant="outline" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'إغلاق' : 'إضافة موظف'}
          </Button>
        }
      />

      {showForm && (
        <AddUserForm
          onDone={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {data && (
        <Card className="p-0">
          {data.length === 0 ? (
            <EmptyState text="لا يوجد مستخدمون" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {data.map((u) => (
                <UserRow key={u.id} user={u} onChanged={refetch} />
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
