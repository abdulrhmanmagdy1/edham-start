'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Badge, Button, Card, EmptyState, ErrorText, PageHeader, Spinner } from '@/components/ui';
import { orderStatusArabic, vehicleTypeArabic } from '@/lib/labels';
import { Order } from '@edham/shared-types';

export default function CustomerOrdersPage(): React.ReactElement {
  const router = useRouter();
  const { data, loading, error } = useQuery<Order[]>(() => api.get<Order[]>('/orders/my'));

  return (
    <div>
      <PageHeader
        title="طلباتي"
        action={<Button onClick={() => router.push('/customer/new-order')}>طلب جديد</Button>}
      />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState text="لا توجد طلبات بعد — ابدأ بطلب شحن جديد" />
      )}

      {!loading && !error && data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((order) => (
            <Link key={order.id} href={`/customer/orders/${order.id}`} className="block">
              <Card className="h-full transition hover:border-edham-red">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-edham-black">
                    {order.deliveryAddress}
                  </span>
                  <Badge status={order.status} label={orderStatusArabic(order.status)} />
                </div>
                <dl className="space-y-1 text-sm text-neutral-600">
                  <div className="flex justify-between">
                    <dt className="text-neutral-400">المركبة</dt>
                    <dd>{vehicleTypeArabic(order.vehicleTypeRequired)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-400">الوزن</dt>
                    <dd>{order.cargoWeightKg} كجم</dd>
                  </div>
                </dl>

                {order.status === 'PRICED' && order.quotedPrice !== null && (
                  <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-edham-red">
                    عرض سعر بانتظار موافقتك: {order.quotedPrice} {order.currency}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
