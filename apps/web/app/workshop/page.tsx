'use client';

import Link from 'next/link';
import { api } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorText,
  PageHeader,
  Spinner,
} from '@/components/ui';
import { maintenanceStatusArabic } from '@/lib/labels';
import { MaintenanceRequest, maintenanceTypeArabic } from './types';

export default function WorkshopListPage(): React.ReactElement {
  const { data, loading, error } = useQuery<MaintenanceRequest[]>(
    () => api.get<MaintenanceRequest[]>('/maintenance'),
    [],
  );

  return (
    <div>
      <PageHeader
        title="طلبات الصيانة"
        action={
          <Link href="/workshop/new">
            <Button>طلب صيانة جديد</Button>
          </Link>
        }
      />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {!loading && !error && data && data.length === 0 && (
        <EmptyState text="لا توجد طلبات صيانة بعد" />
      )}

      {!loading && !error && data && data.length > 0 && (
        <div className="grid gap-4">
          {data.map((req) => (
            <Link key={req.id} href={`/workshop/maintenance/${req.id}`}>
              <Card className="transition hover:border-edham-red">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold text-edham-black">
                        {maintenanceTypeArabic(req.type)}
                      </span>
                      <span className="text-sm text-neutral-500">
                        لوحة: {req.vehicle?.plateNumber ?? '—'}
                      </span>
                    </div>
                    <p className="truncate text-sm text-neutral-600">{req.description}</p>
                  </div>
                  <Badge status={req.status} label={maintenanceStatusArabic(req.status)} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
