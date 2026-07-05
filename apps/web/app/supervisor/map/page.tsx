'use client';

import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Button, Card, Spinner, ErrorText, PageHeader, EmptyState } from '@/components/ui';
import { LiveMap, type MapPoint } from '@/components/live-map';

interface FleetLocation {
  vehicleId: string;
  lat: number;
  lng: number;
}

export default function SupervisorMapPage(): React.ReactElement {
  const { data, loading, error, refetch } = useQuery<FleetLocation[]>(
    () => api.get<FleetLocation[]>('/locations/fleet'),
    [],
  );

  const points: MapPoint[] = (data ?? []).map((l) => ({
    id: l.vehicleId,
    lat: l.lat,
    lng: l.lng,
    label: l.vehicleId,
  }));

  return (
    <div>
      <PageHeader
        title="الخريطة الحية"
        action={
          <Button variant="outline" onClick={refetch}>
            تحديث
          </Button>
        }
      />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {!loading && !error && (
        <Card className="p-3">
          {points.length === 0 ? (
            <EmptyState text="لا توجد مركبات نشطة على الخريطة حالياً" />
          ) : (
            <LiveMap points={points} height={480} />
          )}
        </Card>
      )}
    </div>
  );
}
