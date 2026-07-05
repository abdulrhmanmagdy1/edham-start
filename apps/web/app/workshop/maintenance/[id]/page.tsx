'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import {
  Badge,
  Button,
  Card,
  ErrorText,
  Input,
  PageHeader,
  Spinner,
} from '@/components/ui';
import { maintenanceStatusArabic } from '@/lib/labels';
import { MaintenanceRequest, maintenanceTypeArabic } from '../../types';

type Status = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export default function MaintenanceDetailPage({
  params,
}: {
  params: { id: string };
}): React.ReactElement {
  const router = useRouter();
  const { id } = params;
  const { data, loading, error, refetch } = useQuery<MaintenanceRequest>(
    () => api.get<MaintenanceRequest>(`/maintenance/${id}`),
    [id],
  );

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCost, setShowCost] = useState(false);
  const [cost, setCost] = useState('');

  async function updateStatus(status: Status, costValue?: number): Promise<void> {
    setBusy(true);
    setActionError(null);
    try {
      await api.patch<MaintenanceRequest>(`/maintenance/${id}/status`, {
        status,
        ...(costValue !== undefined ? { cost: costValue } : {}),
      });
      setShowCost(false);
      setCost('');
      refetch();
    } catch (e: unknown) {
      setActionError(e instanceof ApiError ? e.message : 'تعذّر تحديث الحالة');
    } finally {
      setBusy(false);
    }
  }

  function handleComplete(): void {
    const parsed = Number(cost);
    if (cost.trim() === '' || Number.isNaN(parsed) || parsed < 0) {
      setActionError('أدخل تكلفة صحيحة');
      return;
    }
    void updateStatus('COMPLETED', parsed);
  }

  const isFinal = data?.status === 'COMPLETED' || data?.status === 'CANCELLED';

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="تفاصيل طلب الصيانة"
        action={
          <Button variant="outline" onClick={() => router.push('/workshop')}>
            رجوع
          </Button>
        }
      />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {!loading && !error && data && (
        <Card className="grid gap-5">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-edham-black">
              {maintenanceTypeArabic(data.type)}
            </span>
            <Badge status={data.status} label={maintenanceStatusArabic(data.status)} />
          </div>

          <dl className="grid gap-3 text-sm">
            <Row label="رقم اللوحة" value={data.vehicle?.plateNumber ?? '—'} />
            <Row label="الوصف" value={data.description} />
            <Row
              label="التكلفة"
              value={data.cost !== null ? `${data.cost} ر.س` : 'لم تُحدَّد'}
            />
            <Row
              label="تاريخ الإنشاء"
              value={new Date(data.createdAt).toLocaleString('ar-SA')}
            />
          </dl>

          {actionError && <ErrorText message={actionError} />}

          {!isFinal && (
            <div className="border-t border-neutral-200 pt-4">
              {data.status === 'OPEN' && (
                <div className="flex gap-3">
                  <Button disabled={busy} onClick={() => void updateStatus('IN_PROGRESS')}>
                    بدء التنفيذ
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void updateStatus('CANCELLED')}
                  >
                    إلغاء الطلب
                  </Button>
                </div>
              )}

              {data.status === 'IN_PROGRESS' && !showCost && (
                <div className="flex gap-3">
                  <Button disabled={busy} onClick={() => setShowCost(true)}>
                    إكمال
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void updateStatus('CANCELLED')}
                  >
                    إلغاء الطلب
                  </Button>
                </div>
              )}

              {data.status === 'IN_PROGRESS' && showCost && (
                <div className="grid gap-3">
                  <Input
                    label="تكلفة الصيانة (ر.س)"
                    type="number"
                    value={cost}
                    onChange={setCost}
                    placeholder="0"
                  />
                  <div className="flex gap-3">
                    <Button disabled={busy} onClick={handleComplete}>
                      {busy ? 'جارٍ الحفظ…' : 'تأكيد الإكمال'}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setShowCost(false);
                        setActionError(null);
                      }}
                    >
                      تراجع
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-left font-medium text-edham-black">{value}</dd>
    </div>
  );
}
