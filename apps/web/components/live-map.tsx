'use client';

import dynamic from 'next/dynamic';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

/** Leaflet يحتاج المتصفح — نحمّله بلا SSR. */
const OsmPointsMap = dynamic(
  () => import('./osm-map').then((m) => m.OsmPointsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
        جاري تحميل الخريطة…
      </div>
    ),
  },
);

/** خريطة حيّة تعرض نقاطاً (مركبات/شحنة) — OpenStreetMap مجاني بلا مفتاح. */
export function LiveMap({
  points,
  height = 420,
  zoom = 6,
}: {
  points: MapPoint[];
  height?: number;
  zoom?: number;
}): React.ReactElement {
  return <OsmPointsMap points={points} height={height} zoom={zoom} />;
}
