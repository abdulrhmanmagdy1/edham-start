'use client';

import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import { Card, Spinner, ErrorText, PageHeader, Badge, EmptyState } from '@/components/ui';
import type { Driver } from '@edham/shared-types';

function driverStatusArabic(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: 'متاح',
    ON_TRIP: 'في رحلة',
    OFF_DUTY: 'خارج الدوام',
    SUSPENDED: 'موقوف',
  };
  return map[status] ?? status;
}

export default function SupervisorDriversPage(): React.ReactElement {
  const { data, loading, error } = useQuery<Driver[]>(() => api.get<Driver[]>('/drivers'), []);

  return (
    <div>
      <PageHeader title="السائقون" />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {data && (
        <Card className="p-0">
          {data.length === 0 ? (
            <EmptyState text="لا يوجد سائقون مسجّلون" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {data.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-medium text-edham-black">{d.employeeId}</p>
                    <p className="text-sm text-neutral-500">رخصة: {d.licenseNumber}</p>
                  </div>
                  <Badge status={d.status} label={driverStatusArabic(d.status)} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
