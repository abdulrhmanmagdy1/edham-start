'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { useRealtime, SOCKET_EVENTS } from '@/lib/realtime';
import { Card, Spinner, ErrorText, PageHeader, Badge, EmptyState } from '@/components/ui';
import { orderStatusArabic } from '@/lib/labels';
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

interface DashboardData {
  pendingPricing: number;
  confirmed: number;
  inTransit: number;
  recent: Order[];
}

async function loadDashboard(): Promise<DashboardData> {
  const [pending, confirmed, transit, recent] = await Promise.all([
    api.get<OrdersResponse>('/orders?status=PENDING_PRICING&page=1&limit=1'),
    api.get<OrdersResponse>('/orders?status=CUSTOMER_CONFIRMED&page=1&limit=1'),
    api.get<OrdersResponse>('/orders?status=IN_TRANSIT&page=1&limit=1'),
    api.get<OrdersResponse>('/orders?page=1&limit=8'),
  ]);
  return {
    pendingPricing: pending.meta.total,
    confirmed: confirmed.meta.total,
    inTransit: transit.meta.total,
    recent: recent.data,
  };
}

function Kpi({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  accent: string;
}): React.ReactElement {
  return (
    <Link href={href}>
      <Card className="transition hover:border-edham-red">
        <p className="text-sm text-neutral-500">{label}</p>
        <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      </Card>
    </Link>
  );
}

export default function SupervisorDashboardPage(): React.ReactElement {
  const { data, loading, error, refetch } = useQuery<DashboardData>(() => loadDashboard(), []);

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
      <PageHeader title="لوحة التحكم" action={<LiveIndicator connected={connected} />} />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Kpi
              label="بانتظار التسعير"
              value={data.pendingPricing}
              href="/supervisor/orders?status=PENDING_PRICING"
              accent="text-amber-600"
            />
            <Kpi
              label="مؤكّدة — للإسناد"
              value={data.confirmed}
              href="/supervisor/orders?status=CUSTOMER_CONFIRMED"
              accent="text-edham-red"
            />
            <Kpi
              label="في الطريق"
              value={data.inTransit}
              href="/supervisor/orders?status=IN_TRANSIT"
              accent="text-green-600"
            />
          </div>

          <h2 className="mb-3 mt-8 text-lg font-bold text-edham-black">آخر الطلبات</h2>
          <Card className="p-0">
            {data.recent.length === 0 ? (
              <EmptyState text="لا توجد طلبات بعد" />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {data.recent.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/supervisor/orders/${o.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-neutral-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-edham-black">{o.pickupAddress}</p>
                        <p className="truncate text-sm text-neutral-500">
                          إلى: {o.deliveryAddress}
                        </p>
                      </div>
                      <Badge status={o.status} label={orderStatusArabic(o.status)} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
