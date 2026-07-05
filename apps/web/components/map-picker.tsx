'use client';

import { useCallback, useState } from 'react';
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
 * عند غياب مفتاح الخرائط يعرض حقل عنوان نصي بديل.
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
  const { isLoaded } = useJsApiLoader({
    id: 'edham-maps',
    googleMapsApiKey: config.mapsApiKey,
    libraries: LIBRARIES,
    language: 'ar',
  });

  const [resolving, setResolving] = useState(false);

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

  // بديل بدون مفتاح خرائط: إدخال نصي فقط حتى لا تتعطّل الصفحة.
  if (!config.mapsApiKey) {
    return (
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
        <input
          type="text"
          value={value?.address ?? ''}
          placeholder="أدخل العنوان يدوياً"
          onChange={(e) => onChange({ lat: 0, lng: 0, address: e.target.value })}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 outline-none focus:border-edham-red"
        />
        <span className="mt-1 block text-xs text-neutral-400">
          الخريطة غير متاحة (مفتاح NEXT_PUBLIC_GOOGLE_MAPS_API_KEY غير مضبوط) — أدخل العنوان يدوياً.
        </span>
      </label>
    );
  }

  const marker: google.maps.LatLngLiteral = value
    ? { lat: value.lat, lng: value.lng }
    : RIYADH;

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
      <span className="mt-1 block text-xs text-neutral-500">
        {resolving
          ? 'جارٍ تحديد العنوان…'
          : value
            ? `الموقع المختار: ${value.address}`
            : 'انقر على الخريطة أو اسحب المؤشر لتحديد الموقع'}
      </span>
    </div>
  );
}
