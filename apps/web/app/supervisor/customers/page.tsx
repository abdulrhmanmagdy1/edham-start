'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Button, Card, EmptyState, ErrorText, Input, PageHeader, Spinner } from '@/components/ui';

interface CustomerRow {
  id: string;
  companyName: string;
  commercialRegistrationNumber: string | null;
  vatNumber: string | null;
  contactPersonName: string | null;
  paymentTermsDays: number;
  creditLimit: number | null;
  contact: { fullName: string; phone: string; email: string | null; status: string } | null;
  ordersCount: number;
  invoicesCount: number;
}

function AddCustomerForm({ onDone }: { onDone: () => void }): React.ReactElement {
  const [companyName, setCompanyName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [crn, setCrn] = useState('');
  const [vat, setVat] = useState('');
  const [terms, setTerms] = useState('30');
  const [creditLimit, setCreditLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setErr(null);
    if (companyName.trim() === '' || contactPersonName.trim() === '' || phone.trim() === '') {
      setErr('أكمل اسم الشركة ومسؤول التواصل ورقم الجوال');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        companyName: companyName.trim(),
        contactPersonName: contactPersonName.trim(),
        phone: phone.trim(),
        paymentTermsDays: Number(terms) || 30,
      };
      if (email.trim()) body.email = email.trim();
      if (crn.trim()) body.commercialRegistrationNumber = crn.trim();
      if (vat.trim()) body.vatNumber = vat.trim();
      if (creditLimit.trim()) body.creditLimit = Number(creditLimit);
      await api.post('/customers', body);
      onDone();
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-bold text-edham-black">إضافة شركة عميلة</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="اسم الشركة" value={companyName} onChange={setCompanyName} />
        <Input label="مسؤول التواصل" value={contactPersonName} onChange={setContactPersonName} />
        <Input label="رقم الجوال" value={phone} onChange={setPhone} placeholder="+9665XXXXXXXX" />
        <Input label="البريد الإلكتروني (اختياري)" type="email" value={email} onChange={setEmail} />
        <Input label="السجل التجاري (اختياري)" value={crn} onChange={setCrn} />
        <Input label="الرقم الضريبي (اختياري)" value={vat} onChange={setVat} />
        <Input label="مدة السداد (يوم)" type="number" value={terms} onChange={setTerms} />
        <Input label="حد الائتمان (اختياري)" type="number" value={creditLimit} onChange={setCreditLimit} />
      </div>
      {err && (
        <div className="mt-4">
          <ErrorText message={err} />
        </div>
      )}
      <div className="mt-4">
        <Button type="button" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'جارٍ الحفظ…' : 'حفظ الشركة'}
        </Button>
      </div>
    </Card>
  );
}

export default function SupervisorCustomersPage(): React.ReactElement {
  const { data, loading, error, refetch } = useQuery<CustomerRow[]>(
    () => api.get<CustomerRow[]>('/customers'),
    [],
  );
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <PageHeader
        title="العملاء (الشركات)"
        action={
          <div className="flex gap-2">
            <Link href="/supervisor/customers/new-order">
              <Button variant="outline">إنشاء طلب نيابةً</Button>
            </Link>
            <Button onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'إغلاق' : 'إضافة شركة'}
            </Button>
          </div>
        }
      />

      {showForm && (
        <AddCustomerForm
          onDone={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {data && (
        <Card className="overflow-x-auto p-0">
          {data.length === 0 ? (
            <EmptyState text="لا توجد شركات بعد" />
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الشركة</th>
                  <th className="px-4 py-3 font-medium">مسؤول التواصل</th>
                  <th className="px-4 py-3 font-medium">الجوال</th>
                  <th className="px-4 py-3 font-medium">مدة السداد</th>
                  <th className="px-4 py-3 font-medium">الطلبات</th>
                  <th className="px-4 py-3 font-medium">الفواتير</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-semibold text-edham-black">{c.companyName}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.contactPersonName ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.contact?.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.paymentTermsDays} يوم</td>
                    <td className="px-4 py-3 text-neutral-600">{c.ordersCount}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.invoicesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
