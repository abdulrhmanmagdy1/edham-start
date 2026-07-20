'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { reverseGeocodeOsm } from '@/lib/geocode';

export interface MapLocation {
  lat: number;
  lng: number;
  address: string;
}

const RIYADH = { lat: 24.7136, lng: 46.6753 };

/** Leaflet يحتاج المتصفح — بلا SSR. */
const OsmPickerMap = dynamic(
  () => import('./osm-map').then((m) => m.OsmPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
        جاري تحميل الخريطة…
      </div>
    ),
  },
);

/**
 * منتقي موقع على خريطة OpenStreetMap (مجانية بلا مفتاح).
 * انقر على الخريطة أو اسحب المؤشر → يجلب العنوان تلقائياً (Nominatim).
 * يبقى خيار "إدخال يدوي" متاحاً دائماً.
 */
export function MapPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MapLocation | null;
  onChange: (v: MapLocation) => void;
}): React.ReactElement {
  const [resolving, setResolving] = useState(false);
  const [manual, setManual] = useState(false);

  const handlePick = useCallback(
    (lat: number, lng: number): void => {
      setResolving(true);
      void reverseGeocodeOsm(lat, lng).then((address) => {
        setResolving(false);
        onChange({ lat, lng, address });
      });
    },
    [onChange],
  );

  if (manual) {
    return (
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
        <input
          type="text"
          value={value?.address ?? ''}
          placeholder="أدخل العنوان يدوياً (مثال: مستودع الرياض — حي الصناعية)"
          onChange={(e) =>
            onChange({
              lat: value?.lat ?? RIYADH.lat,
              lng: value?.lng ?? RIYADH.lng,
              address: e.target.value,
            })
          }
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-edham-red"
        />
        <button
          type="button"
          onClick={() => setManual(false)}
          className="mt-1 text-xs text-edham-red hover:underline"
        >
          العودة للخريطة
        </button>
      </label>
    );
  }

  const lat = value?.lat ?? RIYADH.lat;
  const lng = value?.lng ?? RIYADH.lng;

  return (
    <div className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      <OsmPickerMap lat={lat} lng={lng} zoom={value ? 13 : 10} height={256} onPick={handlePick} />
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-neutral-500">
          {resolving
            ? 'جارٍ تحديد العنوان…'
            : value
              ? `الموقع المختار: ${value.address}`
              : 'انقر على الخريطة أو اسحب المؤشر لتحديد الموقع'}
        </span>
        <button
          type="button"
          onClick={() => setManual(true)}
          className="shrink-0 text-xs text-edham-red hover:underline"
        >
          إدخال يدوي
        </button>
      </div>
    </div>
  );
}
