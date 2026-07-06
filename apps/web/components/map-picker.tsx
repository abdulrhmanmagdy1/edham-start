'use client';

import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { config } from '@/lib/config';

export interface MapLocation {
  lat: number;
  lng: number;
  address: string;
}

const RIYADH: google.maps.LatLngLiteral = { lat: 24.7136, lng: 46.6753 };

// ثابت خارج المكوّن حتى لا يُعاد تحميل السكربت في كل render.
const LIBRARIES: ('places')[] = ['places'];

/** يحوّل إحداثيات إلى عنوان نصي عبر Reverse Geocoding (بالعربية). */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const geocoder = new google.maps.Geocoder();
    const res: google.maps.GeocoderResponse = await geocoder.geocode({
      location: { lat, lng },
    });
    const first = res.results[0];
    return first?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

/**
 * منتقي موقع على خريطة Google.
 * marker قابل للسحب + النقر على الخريطة يحرّكه، ثم يجلب العنوان تلقائياً.
 * fallback: إدخال يدوي عند غياب المفتاح أو فشل تحميل الخريطة (auth failure).
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
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'edham-maps',
    googleMapsApiKey: config.mapsApiKey,
    libraries: LIBRARIES,
    language: 'ar',
  });

  const [resolving, setResolving] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  const [manual, setManual] = useState(false);

  // Google يستدعي window.gm_authFailure عند رفض المفتاح (مشروع معطّل/مقيّد).
  useEffect(() => {
    const w = window as unknown as { gm_authFailure?: () => void };
    w.gm_authFailure = (): void => setAuthFailed(true);
    return () => {
      w.gm_authFailure = undefined;
    };
  }, []);

  const commitPosition = useCallback(
    async (lat: number, lng: number): Promise<void> => {
      setResolving(true);
      const address = await reverseGeocode(lat, lng);
      setResolving(false);
      onChange({ lat, lng, address });
    },
    [onChange],
  );

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent): void => {
      const pos = e.latLng;
      if (pos) void commitPosition(pos.lat(), pos.lng());
    },
    [commitPosition],
  );

  const handleDragEnd = useCallback(
    (e: google.maps.MapMouseEvent): void => {
      const pos = e.latLng;
      if (pos) void commitPosition(pos.lat(), pos.lng());
    },
    [commitPosition],
  );

  const mapUnavailable = !config.mapsApiKey || Boolean(loadError) || authFailed || manual;

  // بديل يدوي: إدخال نصي + إحداثيات افتراضية (الرياض) حتى لا تتعطّل الطلبات.
  if (mapUnavailable) {
    const reason = !config.mapsApiKey
      ? 'الخريطة غير متاحة (المفتاح غير مضبوط)'
      : authFailed || loadError
        ? 'تعذّر تحميل خرائط Google (المفتاح مرفوض) — أدخل العنوان يدوياً'
        : 'إدخال يدوي';
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
        <span className="mt-1 block text-xs text-neutral-400">{reason}</span>
      </label>
    );
  }

  const marker: google.maps.LatLngLiteral = value ? { lat: value.lat, lng: value.lng } : RIYADH;

  return (
    <div className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {!isLoaded ? (
        <div className="flex h-64 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
          جاري تحميل الخريطة…
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: 256 }}
            center={marker}
            zoom={value ? 13 : 10}
            onClick={handleMapClick}
          >
            <Marker position={marker} draggable onDragEnd={handleDragEnd} />
          </GoogleMap>
        </div>
      )}
      <div className="mt-1 flex items-center justify-between">
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
          className="text-xs text-edham-red hover:underline"
        >
          إدخال يدوي
        </button>
      </div>
    </div>
  );
}
