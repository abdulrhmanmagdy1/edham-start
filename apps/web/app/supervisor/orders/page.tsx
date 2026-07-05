'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { useRealtime, SOCKET_EVENTS } from '@/lib/realtime';
import { Card, Spinner, ErrorText, PageHeader, Badge, EmptyState } from '@/components/ui';
import { orderStatusArabic, vehicleTypeArabic } from '@/lib/labels';
import type { Order, PaginationMeta } from '@edham/shared-types';

function LiveIndicator({ connected }: { connected: boolean }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        connected ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-400'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-neutral-300'}`}
      />
      {connected ? 'مباشر' : 'غير متصل'}
    </span>
  );
}

interface OrdersResponse {
  data: Order[];
  meta: PaginationMeta;
}

interface Filter {
  key: string;
  label: string;
  status: string | null;
}

const FILTERS: Filter[] = [
  { key: 'PENDING_PRICING', label: 'بانتظار التسعير', status: 'PENDING_PRICING' },
  { key: 'CUSTOMER_CONFIRMED', label: 'مؤكّدة', status: 'CUSTOMER_CONFIRMED' },
  { key: 'IN_TRANSIT', label: 'نشطة', status: 'IN_TRANSIT' },
  { key: 'ALL', label: 'الكل', status: null },
];

function OrdersContent(): React.ReactElement {
  const params = useSearchParams();
  const initial = params.get('status');
  const [active, setActive] = useState<string>(
    FILTERS.some((f) => f.key === initial) ? (initial as string) : 'PENDING_PRICING',
  );

  const current = FILTERS.find((f) => f.key === active) ?? FILTERS[0];
  const statusQuery = current?.status ? `status=${current.status}&` : '';

  const { data, loading, error, refetch } = useQuery<OrdersResponse>(
    () => api.get<OrdersResponse>(`/orders?${statusQuery}page=1&limit=50`),
    [active],
  );

  const [connected, setConnected] = useState(false);
  useRealtime(
    {
      [SOCKET_EVENTS.orderStatusChanged]: () => refetch(),
      [SOCKET_EVENTS.orderPriceReceived]: () => refetch(),
    },
    { onConnectionChange: setConnected },
  );

  return (
    <div>
      <PageHeader title="الطلبات" action={<LiveIndicator connected={connected} />} />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActive(f.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active === f.key
                ? 'bg-edham-red text-white'
                : 'border border-neutral-300 text-edham-black hover:bg-neutral-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {data && (
        <Card className="p-0">
          {data.data.length === 0 ? (
            <EmptyState text="لا توجد طلبات مطابقة" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {data.data.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/supervisor/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-edham-black">{o.pickupAddress}</p>
                      <p className="truncate text-sm text-neutral-500">إلى: {o.deliveryAddress}</p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {vehicleTypeArabic(o.vehicleTypeRequired)} · {o.cargoWeightKg} كجم
                      </p>
                    </div>
                    <Badge status={o.status} label={orderStatusArabic(o.status)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

export default function SupervisorOrdersPage(): React.ReactElement {
  return (
    <Suspense fallback={<Spinner />}>
      <OrdersContent />
    </Suspense>
  );
}
