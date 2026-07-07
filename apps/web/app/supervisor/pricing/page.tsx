'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Button, Card, EmptyState, ErrorText, Input, PageHeader, Spinner } from '@/components/ui';

interface PricingTier {
  id: string;
  name: string;
  basePricePerKm: number | null;
  basePricePerKg: number | null;
  temperatureSurcharge: number | null;
  minCharge: number | null;
}

function num(v: number | null): string {
  return v === null ? '—' : v.toLocaleString('ar-SA');
}

function AddTierForm({ onDone }: { onDone: () => void }): React.ReactElement {
  const [name, setName] = useState('');
  const [perKm, setPerKm] = useState('');
  const [perKg, setPerKg] = useState('');
  const [surcharge, setSurcharge] = useState('');
  const [minCharge, setMinCharge] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setErr(null);
    if (name.trim() === '') {
      setErr('اسم الشريحة مطلوب');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { name: name.trim() };
      if (perKm.trim()) body.basePricePerKm = Number(perKm);
      if (perKg.trim()) body.basePricePerKg = Number(perKg);
      if (surcharge.trim()) body.temperatureSurcharge = Number(surcharge);
      if (minCharge.trim()) body.minCharge = Number(minCharge);
      await api.post('/pricing/tiers', body);
      onDone();
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-bold text-edham-black">إضافة شريحة تعريفة</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="اسم الشريحة" value={name} onChange={setName} />
        <Input label="سعر/كم (ريال)" type="number" value={perKm} onChange={setPerKm} />
        <Input label="سعر/كجم (ريال)" type="number" value={perKg} onChange={setPerKg} />
        <Input label="رسوم التبريد (ريال)" type="number" value={surcharge} onChange={setSurcharge} />
        <Input label="الحد الأدنى للأجرة (ريال)" type="number" value={minCharge} onChange={setMinCharge} />
      </div>
      {err && (
        <div className="mt-4">
          <ErrorText message={err} />
        </div>
      )}
      <div className="mt-4">
        <Button type="button" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'جارٍ الحفظ…' : 'حفظ الشريحة'}
        </Button>
      </div>
    </Card>
  );
}

export default function SupervisorPricingPage(): React.ReactElement {
  const { data, loading, error, refetch } = useQuery<PricingTier[]>(
    () => api.get<PricingTier[]>('/pricing/tiers'),
    [],
  );
  const [showForm, setShowForm] = useState(false);

  async function remove(id: string): Promise<void> {
    await api.del(`/pricing/tiers/${id}`);
    refetch();
  }

  return (
    <div>
      <PageHeader
        title="التسعير (التعريفة المرجعية)"
        action={
          <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'إغلاق' : 'إضافة شريحة'}</Button>
        }
      />

      <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        هذه تعريفة مرجعية داخلية تساعد على تقدير الأسعار. السعر النهائي للطلب يُدخله المشرف يدوياً.
      </p>

      {showForm && (
        <AddTierForm
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
            <EmptyState text="لا توجد شرائح تعريفة بعد" />
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="border-b border-neutral-200 text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">الشريحة</th>
                  <th className="px-4 py-3 font-medium">سعر/كم</th>
                  <th className="px-4 py-3 font-medium">سعر/كجم</th>
                  <th className="px-4 py-3 font-medium">رسوم التبريد</th>
                  <th className="px-4 py-3 font-medium">الحد الأدنى</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-3 font-semibold text-edham-black">{t.name}</td>
                    <td className="px-4 py-3 text-neutral-600">{num(t.basePricePerKm)}</td>
                    <td className="px-4 py-3 text-neutral-600">{num(t.basePricePerKg)}</td>
                    <td className="px-4 py-3 text-neutral-600">{num(t.temperatureSurcharge)}</td>
                    <td className="px-4 py-3 text-neutral-600">{num(t.minCharge)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void remove(t.id)}
                        className="text-xs font-medium text-edham-red hover:underline"
                      >
                        حذف
                      </button>
                    </td>
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
