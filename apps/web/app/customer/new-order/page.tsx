'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Button, Card, ErrorText, Input, PageHeader } from '@/components/ui';
import { MapPicker, type MapLocation } from '@/components/map-picker';
import { vehicleTypeArabic } from '@/lib/labels';
import { CargoType, Order, TemperatureType, VehicleType } from '@edham/shared-types';

const CARGO_LABELS: Record<CargoType, string> = {
  [CargoType.DRY]: 'جاف',
  [CargoType.CHILLED]: 'مبرّد',
  [CargoType.FROZEN]: 'مجمّد',
  [CargoType.HAZARDOUS]: 'خطِر',
};

const TEMP_LABELS: Record<TemperatureType, string> = {
  [TemperatureType.REFRIGERATED]: 'مبرّد',
  [TemperatureType.FROZEN]: 'مجمّد',
};

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 outline-none focus:border-edham-red"
      >
        {children}
      </select>
    </label>
  );
}

export default function NewOrderPage(): React.ReactElement {
  const router = useRouter();

  const [pickup, setPickup] = useState<MapLocation | null>(null);
  const [delivery, setDelivery] = useState<MapLocation | null>(null);
  const [deliveryCity, setDeliveryCity] = useState('');
  const [cargoType, setCargoType] = useState<CargoType>(CargoType.DRY);
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.HIACE_VAN);
  const [weight, setWeight] = useState('');
  const [coldChain, setColdChain] = useState(false);
  const [temperatureType, setTemperatureType] = useState<TemperatureType>(
    TemperatureType.REFRIGERATED,
  );
  const [scheduledAt, setScheduledAt] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(): Promise<void> {
    setError(null);

    const weightKg = Number(weight);
    if (!pickup || !pickup.address.trim() || !delivery || !delivery.address.trim()) {
      setError('يرجى تحديد موقعي الاستلام والتسليم على الخريطة');
      return;
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setError('يرجى إدخال وزن صحيح');
      return;
    }
    if (!scheduledAt) {
      setError('يرجى اختيار تاريخ الجدولة');
      return;
    }

    setSubmitting(true);
    try {
      await api.post<Order>('/orders', {
        pickup: { address: pickup.address.trim(), lat: pickup.lat, lng: pickup.lng },
        stops: [
          {
            sequenceNumber: 1,
            address: delivery.address.trim(),
            city: deliveryCity.trim() || undefined,
            lat: delivery.lat,
            lng: delivery.lng,
          },
        ],
        vehicleTypeRequired: vehicleType,
        cargoType,
        cargoWeightKg: weightKg,
        coldChainRequired: coldChain,
        temperatureType: coldChain ? temperatureType : undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      router.push('/customer');
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'تعذّر إرسال الطلب');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="طلب شحن جديد" />

      <Card>
        <div className="space-y-4">
          <MapPicker label="موقع الاستلام" value={pickup} onChange={setPickup} />
          <MapPicker label="موقع التسليم" value={delivery} onChange={setDelivery} />
          <Input label="مدينة التسليم" value={deliveryCity} onChange={setDeliveryCity} />

          <Select
            label="نوع البضاعة"
            value={cargoType}
            onChange={(v) => setCargoType(v as CargoType)}
          >
            {Object.values(CargoType).map((t) => (
              <option key={t} value={t}>
                {CARGO_LABELS[t]}
              </option>
            ))}
          </Select>

          <Select
            label="نوع المركبة"
            value={vehicleType}
            onChange={(v) => setVehicleType(v as VehicleType)}
          >
            {Object.values(VehicleType).map((t) => (
              <option key={t} value={t}>
                {vehicleTypeArabic(t)}
              </option>
            ))}
          </Select>

          <Input label="الوزن (كجم)" value={weight} onChange={setWeight} type="number" />

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={coldChain}
              onChange={(e) => setColdChain(e.target.checked)}
              className="h-5 w-5 accent-edham-red"
            />
            <span className="text-sm font-medium text-neutral-700">يتطلب سلسلة تبريد</span>
          </label>

          {coldChain && (
            <Select
              label="نوع التبريد"
              value={temperatureType}
              onChange={(v) => setTemperatureType(v as TemperatureType)}
            >
              {Object.values(TemperatureType).map((t) => (
                <option key={t} value={t}>
                  {TEMP_LABELS[t]}
                </option>
              ))}
            </Select>
          )}

          <Input
            label="تاريخ الجدولة"
            value={scheduledAt}
            onChange={setScheduledAt}
            type="date"
          />

          {error && <ErrorText message={error} />}

          <Button type="button" onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'جارٍ الإرسال…' : 'إرسال الطلب'}
          </Button>

          <p className="text-center text-xs text-neutral-400">
            سيتم مراجعة طلبك وتحديد السعر من قِبل المشرف قبل إرساله إليك.
          </p>
        </div>
      </Card>
    </div>
  );
}
