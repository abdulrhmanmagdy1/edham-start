'use client';

import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { useRealtime, SOCKET_EVENTS } from '@/lib/realtime';
import { Badge, Card, ErrorText, PageHeader, Spinner } from '@/components/ui';
import { orderStatusArabic } from '@/lib/labels';
import { LiveMap, MapPoint } from '@/components/live-map';

interface TrackData {
  orderId: string;
  status: string;
  trip: { id: string; status: string } | null;
  lastLocation: { lat: number; lng: number } | null;
  stops: { sequenceNumber: number; address: string; status: string }[];
}

const STOP_STATUS_LABELS: Record<string, string> = {
  PENDING: 'بانتظار الوصول',
  ARRIVED: 'وصل',
  DELIVERED: 'تم التسليم',
};

export default function TrackPage({
  params,
}: {
  params: { id: string };
}): React.ReactElement {
  const { id } = params;
  const { data, loading, error, refetch } = useQuery<TrackData>(
    () => api.get<TrackData>(`/orders/${id}/track`),
    [id],
  );

  useRealtime({
    [SOCKET_EVENTS.driverLocationUpdated]: () => refetch(),
    [SOCKET_EVENTS.orderStatusChanged]: (payload) => {
      const { orderId } = payload as { orderId: string; newStatus: string };
      if (orderId === id) refetch();
    },
  });

  if (loading) return <Spinner />;
  if (error) return <ErrorText message={error} />;
  if (!data) return <ErrorText message="تعذّر جلب بيانات التتبّع" />;

  const points: MapPoint[] = data.lastLocation
    ? [{ id: 'vehicle', lat: data.lastLocation.lat, lng: data.lastLocation.lng, label: 'المركبة' }]
    : [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="تتبّع الشحنة"
        action={<Badge status={data.status} label={orderStatusArabic(data.status)} />}
      />

      {data.lastLocation ? (
        <LiveMap points={points} zoom={11} />
      ) : (
        <Card>
          <p className="py-8 text-center text-neutral-400">لم يبدأ التتبّع الحي بعد</p>
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="mb-3 text-lg font-bold text-edham-black">المحطات</h2>
        {data.stops.length === 0 ? (
          <p className="text-sm text-neutral-400">لا توجد محطات</p>
        ) : (
          <ol className="space-y-2">
            {data.stops.map((stop) => (
              <li
                key={stop.sequenceNumber}
                className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm text-edham-black">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-edham-black text-xs font-bold text-white">
                    {stop.sequenceNumber}
                  </span>
                  {stop.address}
                </span>
                <Badge status={stop.status} label={STOP_STATUS_LABELS[stop.status] ?? stop.status} />
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
