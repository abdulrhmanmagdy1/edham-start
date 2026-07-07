'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { useRealtime, SOCKET_EVENTS } from '@/lib/realtime';
import { Card, Spinner, ErrorText, PageHeader, Badge, EmptyState } from '@/components/ui';
import { orderStatusArabic } from '@/lib/labels';
import type { Order } from '@edham/shared-types';

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

interface DashboardStats {
  orders: {
    total: number;
    pendingPricing: number;
    awaitingCustomer: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  trips: { active: number };
  vehicles: { total: number; available: number; inMaintenance: number };
  drivers: { available: number };
  coldChainCompliancePct: number;
}

interface DashboardData {
  stats: DashboardStats;
  recent: Order[];
}

async function loadDashboard(): Promise<DashboardData> {
  const [stats, recent] = await Promise.all([
    api.get<DashboardStats>('/reports/dashboard'),
    api.getPaged<Order>('/orders?page=1&limit=8'),
  ]);
  return { stats, recent: recent.data };
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi
              label="بانتظار التسعير"
              value={data.stats.orders.pendingPricing}
              href="/supervisor/orders?status=PENDING_PRICING"
              accent="text-amber-600"
            />
            <Kpi
              label="بانتظار موافقة العميل"
              value={data.stats.orders.awaitingCustomer}
              href="/supervisor/orders?status=PRICED"
              accent="text-blue-600"
            />
            <Kpi
              label="قيد التنفيذ"
              value={data.stats.orders.inProgress}
              href="/supervisor/orders"
              accent="text-green-600"
            />
            <Kpi
              label="مكتملة"
              value={data.stats.orders.completed}
              href="/supervisor/orders?status=COMPLETED"
              accent="text-edham-black"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi
              label="رحلات نشطة"
              value={data.stats.trips.active}
              href="/supervisor/map"
              accent="text-edham-red"
            />
            <Kpi
              label="مركبات متاحة"
              value={data.stats.vehicles.available}
              href="/supervisor/vehicles"
              accent="text-green-600"
            />
            <Kpi
              label="سائقون متاحون"
              value={data.stats.drivers.available}
              href="/supervisor/drivers"
              accent="text-green-600"
            />
            <Kpi
              label="التزام التبريد %"
              value={data.stats.coldChainCompliancePct}
              href="/supervisor/cold-chain"
              accent="text-blue-600"
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
