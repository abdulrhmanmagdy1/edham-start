'use client';

import Link from 'next/link';
import { TripStatus, type Trip } from '@edham/shared-types';
import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Badge, Card, EmptyState, ErrorText, PageHeader, Spinner } from '@/components/ui';

/** حالات الرحلة بالعربي — تعريف محلي (labels.ts خارج نطاق التعديل). */
function tripStatusArabic(status: string): string {
  const map: Record<string, string> = {
    [TripStatus.ASSIGNED]: 'مُسندة',
    [TripStatus.IN_PROGRESS]: 'جارية',
    [TripStatus.AT_STOP]: 'عند محطة',
    [TripStatus.COMPLETED]: 'مكتملة',
    [TripStatus.CANCELLED]: 'ملغاة',
  };
  return map[status] ?? status;
}

function isActive(status: string): boolean {
  return status !== TripStatus.COMPLETED && status !== TripStatus.CANCELLED;
}

function TripCard({ trip, highlight }: { trip: Trip; highlight: boolean }): React.ReactElement {
  return (
    <Link href={`/driver/trips/${trip.id}`} className="block">
      <Card
        className={`h-full transition hover:border-edham-red ${
          highlight ? 'border-edham-red ring-1 ring-edham-red/30' : ''
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <span className="block text-sm font-semibold text-edham-black">
              رحلة #{trip.id.slice(0, 8)}
            </span>
            <span className="block text-xs text-neutral-400">طلب #{trip.orderId.slice(0, 8)}</span>
          </div>
          <Badge status={trip.status} label={tripStatusArabic(trip.status)} />
        </div>
        <dl className="space-y-1 text-sm text-neutral-600">
          <div className="flex justify-between">
            <dt className="text-neutral-400">عدد المحطات</dt>
            <dd>{trip.totalStops}</dd>
          </div>
          {trip.estimatedDistanceKm !== null && (
            <div className="flex justify-between">
              <dt className="text-neutral-400">المسافة التقديرية</dt>
              <dd>{trip.estimatedDistanceKm} كم</dd>
            </div>
          )}
        </dl>
      </Card>
    </Link>
  );
}

export default function DriverTripsPage(): React.ReactElement {
  const { data, loading, error } = useQuery<Trip[]>(() => api.get<Trip[]>('/trips/my'));

  const active = data ? data.filter((t) => isActive(t.status)) : [];
  const done = data ? data.filter((t) => !isActive(t.status)) : [];

  return (
    <div>
      <PageHeader title="رحلاتي" />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState text="لا توجد رحلات مُسندة إليك بعد" />
      )}

      {!loading && !error && data && data.length > 0 && (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-edham-red">الرحلات النشطة</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((trip) => (
                  <TripCard key={trip.id} trip={trip} highlight />
                ))}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-neutral-500">رحلات سابقة</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {done.map((trip) => (
                  <TripCard key={trip.id} trip={trip} highlight={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
