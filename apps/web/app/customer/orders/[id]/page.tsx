'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Badge, Button, Card, ErrorText, PageHeader, Spinner } from '@/components/ui';
import { orderStatusArabic, vehicleTypeArabic } from '@/lib/labels';
import { Order, TemperatureType } from '@edham/shared-types';

const TEMP_LABELS: Record<TemperatureType, string> = {
  [TemperatureType.REFRIGERATED]: 'مبرّد',
  [TemperatureType.FROZEN]: 'مجمّد',
};

const ACTIVE_STATUSES = ['ASSIGNED', 'LOADING', 'IN_TRANSIT'];

export default function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}): React.ReactElement {
  const { id } = params;
  const { data, loading, error, refetch } = useQuery<Order>(
    () => api.get<Order>(`/orders/${id}`),
    [id],
  );

  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function decide(action: 'accept-price' | 'reject-price'): Promise<void> {
    setActionError(null);
    setActing(true);
    try {
      await api.post<Order>(`/orders/${id}/${action}`);
      refetch();
    } catch (e: unknown) {
      setActionError(e instanceof ApiError ? e.message : 'تعذّر تنفيذ العملية');
    } finally {
      setActing(false);
    }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorText message={error} />;
  if (!data) return <ErrorText message="الطلب غير موجود" />;

  const isActive = ACTIVE_STATUSES.includes(data.status);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="تفاصيل الطلب"
        action={<Badge status={data.status} label={orderStatusArabic(data.status)} />}
      />

      <Card>
        <dl className="space-y-3 text-sm">
          <Row label="عنوان الاستلام" value={data.pickupAddress} />
          <Row label="عنوان التسليم" value={data.deliveryAddress} />
          <Row label="نوع المركبة" value={vehicleTypeArabic(data.vehicleTypeRequired)} />
          <Row label="الوزن" value={`${data.cargoWeightKg} كجم`} />
          <Row
            label="التبريد"
            value={
              data.coldChainRequired
                ? data.temperatureType
                  ? TEMP_LABELS[data.temperatureType]
                  : 'مطلوب'
                : 'غير مطلوب'
            }
          />
        </dl>
      </Card>

      {data.status === 'PRICED' && data.quotedPrice !== null && (
        <Card className="mt-4 border-edham-red">
          <h2 className="mb-1 text-lg font-bold text-edham-black">عرض السعر</h2>
          <p className="mb-1 text-3xl font-bold text-edham-red">
            {data.quotedPrice} {data.currency}
          </p>
          <p className="mb-4 text-xs text-neutral-400">غير شامل الضريبة 15%</p>

          {actionError && <ErrorText message={actionError} />}

          <div className="mt-3 flex gap-3">
            <Button onClick={() => decide('accept-price')} disabled={acting} className="flex-1">
              قبول
            </Button>
            <Button
              variant="outline"
              onClick={() => decide('reject-price')}
              disabled={acting}
              className="flex-1"
            >
              رفض
            </Button>
          </div>
        </Card>
      )}

      {isActive && (
        <Card className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">تتبّع الشحنة مباشرةً</span>
            <Link href={`/customer/orders/${id}/track`}>
              <Button variant="outline">تتبّع</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex justify-between gap-4 border-b border-neutral-100 pb-2 last:border-0 last:pb-0">
      <dt className="text-neutral-400">{label}</dt>
      <dd className="text-left font-medium text-edham-black">{value}</dd>
    </div>
  );
}
