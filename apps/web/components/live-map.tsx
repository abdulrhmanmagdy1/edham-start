'use client';

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { config } from '../lib/config';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

const RIYADH = { lat: 24.7136, lng: 46.6753 };

/** خريطة Google تعرض نقاطاً (مركبات/شحنة). تحتاج NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. */
export function LiveMap({
  points,
  height = 420,
  zoom = 6,
}: {
  points: MapPoint[];
  height?: number;
  zoom?: number;
}): React.ReactElement {
  const { isLoaded } = useJsApiLoader({
    id: 'edham-maps',
    googleMapsApiKey: config.mapsApiKey,
  });

  if (!config.mapsApiKey) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-400"
      >
        مفتاح الخرائط غير مضبوط (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div style={{ height }} className="flex items-center justify-center rounded-xl bg-neutral-100">
        جاري تحميل الخريطة…
      </div>
    );
  }

  const first = points[0];
  const center = first ? { lat: first.lat, lng: first.lng } : RIYADH;

  return (
    <div className="overflow-hidden rounded-xl">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height }}
        center={center}
        zoom={first ? Math.max(zoom, 10) : zoom}
      >
        {points.map((p) => (
          <Marker key={p.id} position={{ lat: p.lat, lng: p.lng }} title={p.label} />
        ))}
      </GoogleMap>
    </div>
  );
}
