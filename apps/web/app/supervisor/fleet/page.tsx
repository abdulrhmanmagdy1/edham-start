'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useQuery } from '@/hooks/use-query';
import {
  Button,
  Card,
  Input,
  Spinner,
  ErrorText,
  PageHeader,
  Badge,
  EmptyState,
} from '@/components/ui';
import { vehicleTypeArabic } from '@/lib/labels';
import { VehicleType, TemperatureCapability } from '@edham/shared-types';
import type { Vehicle } from '@edham/shared-types';

function vehicleStatusArabic(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: 'متاحة',
    ON_TRIP: 'في رحلة',
    IN_MAINTENANCE: 'في الصيانة',
    OUT_OF_SERVICE: 'خارج الخدمة',
  };
  return map[status] ?? status;
}

const selectClass =
  'w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-edham-red';

function AddVehicleForm({ onDone }: { onDone: () => void }): React.ReactElement {
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState<string>(VehicleType.HIACE_VAN);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [capacityKg, setCapacityKg] = useState('');
  const [temperatureCapability, setTemperatureCapability] = useState<string>(
    TemperatureCapability.REFRIGERATED,
  );
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(): Promise<void> {
    setErr(null);
    const yearNum = Number(year);
    const capNum = Number(capacityKg);
    if (plateNumber.trim() === '' || make.trim() === '' || model.trim() === '') {
      setErr('أكمل حقول اللوحة والصانع والموديل');
      return;
    }
    if (!Number.isFinite(yearNum) || !Number.isFinite(capNum) || capNum <= 0) {
      setErr('أدخل سنة وحمولة صحيحة');
      return;
    }
    setSubmitting(true);
    try {
      await api.post<Vehicle>('/vehicles', {
        plateNumber: plateNumber.trim(),
        type,
        make: make.trim(),
        model: model.trim(),
        year: yearNum,
        capacityKg: capNum,
        temperatureCapability,
      });
      onDone();
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-bold text-edham-black">إضافة مركبة</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="رقم اللوحة" value={plateNumber} onChange={setPlateNumber} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">النوع</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            {Object.values(VehicleType).map((t) => (
              <option key={t} value={t}>
                {vehicleTypeArabic(t)}
              </option>
            ))}
          </select>
        </label>
        <Input label="الصانع" value={make} onChange={setMake} />
        <Input label="الموديل" value={model} onChange={setModel} />
        <Input label="سنة الصنع" type="number" value={year} onChange={setYear} />
        <Input label="الحمولة (كجم)" type="number" value={capacityKg} onChange={setCapacityKg} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-neutral-700">قدرة التبريد</span>
          <select
            value={temperatureCapability}
            onChange={(e) => setTemperatureCapability(e.target.value)}
            className={selectClass}
          >
            <option value={TemperatureCapability.REFRIGERATED}>مبرّد</option>
            <option value={TemperatureCapability.FROZEN}>مجمّد</option>
            <option value={TemperatureCapability.BOTH}>الاثنان</option>
          </select>
        </label>
      </div>
      {err && <div className="mt-4"><ErrorText message={err} /></div>}
      <div className="mt-4">
        <Button type="button" onClick={() => void submit()} disabled={submitting}>
          {submitting ? 'جارٍ الحفظ…' : 'حفظ المركبة'}
        </Button>
      </div>
    </Card>
  );
}

export default function SupervisorFleetPage(): React.ReactElement {
  const { data, loading, error, refetch } = useQuery<Vehicle[]>(
    () => api.get<Vehicle[]>('/vehicles'),
    [],
  );
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <PageHeader
        title="الأسطول"
        action={
          <Button variant="outline" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'إغلاق' : 'إضافة مركبة'}
          </Button>
        }
      />

      {showForm && (
        <AddVehicleForm
          onDone={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {loading && <Spinner />}
      {error && <ErrorText message={error} />}

      {data && (
        <>
          {data.length === 0 ? (
            <EmptyState text="لا توجد مركبات مسجّلة" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((v) => (
                <Card key={v.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-edham-black">{v.plateNumber}</span>
                    <Badge status={v.status} label={vehicleStatusArabic(v.status)} />
                  </div>
                  <p className="text-sm text-neutral-600">{vehicleTypeArabic(v.type)}</p>
                  <p className="text-sm text-neutral-500">
                    {v.make} {v.model} · {v.year}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">الحمولة: {v.capacityKg} كجم</p>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
