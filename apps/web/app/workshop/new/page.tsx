'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Vehicle } from '@edham/shared-types';
import { api, ApiError } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import {
  Button,
  Card,
  ErrorText,
  PageHeader,
  Spinner,
} from '@/components/ui';
import { vehicleTypeArabic } from '@/lib/labels';
import {
  MaintenanceRequest,
  MAINTENANCE_TYPES,
  MaintenanceType,
  maintenanceTypeArabic,
} from '../types';

const SELECT_CLASS =
  'w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-edham-red';

export default function NewMaintenancePage(): React.ReactElement {
  const router = useRouter();
  const { data: vehicles, loading, error } = useQuery<Vehicle[]>(
    () => api.get<Vehicle[]>('/vehicles'),
    [],
  );

  const [vehicleId, setVehicleId] = useState('');
  const [type, setType] = useState<MaintenanceType>('ROUTINE');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canSubmit = vehicleId !== '' && description.trim() !== '' && !submitting;

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post<MaintenanceRequest>('/maintenance', {
        vehicleId,
        type,
        description: description.trim(),
      });
      router.push('/workshop');
    } catch (e: unknown) {
      setFormError(e instanceof ApiError ? e.message : 'تعذّر إنشاء الطلب');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="طلب صيانة جديد" />

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {!loading && !error && (
        <Card>
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">المركبة</span>
              <select
                className={SELECT_CLASS}
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
              >
                <option value="" disabled>
                  اختر المركبة
                </option>
                {(vehicles ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plateNumber} — {vehicleTypeArabic(v.type)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">نوع الصيانة</span>
              <select
                className={SELECT_CLASS}
                value={type}
                onChange={(e) => setType(e.target.value as MaintenanceType)}
              >
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {maintenanceTypeArabic(t)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-neutral-700">الوصف</span>
              <textarea
                className={`${SELECT_CLASS} min-h-28 resize-y`}
                value={description}
                placeholder="اكتب وصف العطل أو الصيانة المطلوبة"
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            {formError && <ErrorText message={formError} />}

            <div className="flex gap-3">
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? 'جارٍ الإنشاء…' : 'إنشاء الطلب'}
              </Button>
              <Button variant="outline" onClick={() => router.push('/workshop')}>
                إلغاء
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
