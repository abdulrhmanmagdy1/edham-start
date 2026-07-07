'use client';

import { useState } from 'react';
import { Button, Card, ErrorText, Input } from '@/components/ui';
import { MapPicker, type MapLocation } from '@/components/map-picker';
import { vehicleTypeArabic } from '@/lib/labels';
import { CargoType, TemperatureType, VehicleType } from '@edham/shared-types';

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

export interface OrderStopInput {
  sequenceNumber: number;
  address: string;
  city?: string;
  lat: number;
  lng: number;
}

export interface OrderFormPayload {
  pickup: { address: string; lat: number; lng: number };
  stops: OrderStopInput[];
  vehicleTypeRequired: VehicleType;
  cargoType: CargoType;
  cargoWeightKg: number;
  coldChainRequired: boolean;
  temperatureType?: TemperatureType;
  scheduledAt: string;
}

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

interface StopState {
  loc: MapLocation | null;
  city: string;
}

/**
 * نموذج طلب شحن متعدد المحطات — يُستخدم للعميل (POST /orders)
 * وللمشرف نيابةً عن شركة (POST /orders/for-customer).
 * onSubmit يرمي خطأً عند الفشل؛ النموذج يعرضه.
 */
export function OrderForm({
  submitLabel,
  note,
  disabled,
  onSubmit,
}: {
  submitLabel: string;
  note?: string;
  disabled?: boolean;
  onSubmit: (payload: OrderFormPayload) => Promise<void>;
}): React.ReactElement {
  const [pickup, setPickup] = useState<MapLocation | null>(null);
  const [stops, setStops] = useState<StopState[]>([{ loc: null, city: '' }]);
  const [cargoType, setCargoType] = useState<CargoType>(CargoType.DRY);
  const [vehicleType, setVehicleType] = useState<VehicleType>(VehicleType.HIACE_VAN);
  const [weight, setWeight] = useState('');
  const [coldChain, setColdChain] = useState(false);
  const [temperatureType, setTemperatureType] = useState<TemperatureType>(TemperatureType.REFRIGERATED);
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateStop(idx: number, patch: Partial<StopState>): void {
    setStops((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function addStop(): void {
    setStops((prev) => [...prev, { loc: null, city: '' }]);
  }
  function removeStop(idx: number): void {
    setStops((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  async function handleSubmit(): Promise<void> {
    setError(null);
    const weightKg = Number(weight);
    if (!pickup || !pickup.address.trim()) {
      setError('يرجى تحديد موقع الاستلام');
      return;
    }
    const validStops = stops.filter((s) => s.loc && s.loc.address.trim());
    if (validStops.length === 0) {
      setError('يرجى تحديد محطة تسليم واحدة على الأقل');
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
      await onSubmit({
        pickup: { address: pickup.address.trim(), lat: pickup.lat, lng: pickup.lng },
        stops: validStops.map((s, i) => ({
          sequenceNumber: i + 1,
          address: (s.loc as MapLocation).address.trim(),
          city: s.city.trim() || undefined,
          lat: (s.loc as MapLocation).lat,
          lng: (s.loc as MapLocation).lng,
        })),
        vehicleTypeRequired: vehicleType,
        cargoType,
        cargoWeightKg: weightKg,
        coldChainRequired: coldChain,
        temperatureType: coldChain ? temperatureType : undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'تعذّر إرسال الطلب');
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <MapPicker label="موقع الاستلام" value={pickup} onChange={setPickup} />

        <div className="space-y-4">
          {stops.map((s, idx) => (
            <div key={idx} className="rounded-xl border border-neutral-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-edham-black">محطة التسليم {idx + 1}</span>
                {stops.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStop(idx)}
                    className="text-xs font-medium text-edham-red hover:underline"
                  >
                    حذف
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <MapPicker
                  label="الموقع"
                  value={s.loc}
                  onChange={(loc) => updateStop(idx, { loc })}
                />
                <Input
                  label="المدينة"
                  value={s.city}
                  onChange={(city) => updateStop(idx, { city })}
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addStop} className="w-full">
            + إضافة محطة تسليم
          </Button>
        </div>

        <Select label="نوع البضاعة" value={cargoType} onChange={(v) => setCargoType(v as CargoType)}>
          {Object.values(CargoType).map((t) => (
            <option key={t} value={t}>
              {CARGO_LABELS[t]}
            </option>
          ))}
        </Select>

        <Select label="نوع المركبة" value={vehicleType} onChange={(v) => setVehicleType(v as VehicleType)}>
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

        <Input label="تاريخ الجدولة" value={scheduledAt} onChange={setScheduledAt} type="date" />

        {error && <ErrorText message={error} />}

        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || disabled}
          className="w-full"
        >
          {submitting ? 'جارٍ الإرسال…' : submitLabel}
        </Button>

        {note && <p className="text-center text-xs text-neutral-400">{note}</p>}
      </div>
    </Card>
  );
}
