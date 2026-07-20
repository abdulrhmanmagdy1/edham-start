'use client';

import { useCallback, useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface OsmPoint {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

export const RIYADH: { lat: number; lng: number } = { lat: 24.7136, lng: 46.6753 };

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** دبّوس بهوية إدهام (أحمر) — divIcon يتجنّب مشكلة صور Leaflet الافتراضية مع الـ bundlers. */
function pinIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html:
      '<div style="width:26px;height:26px;transform:translate(-13px,-26px)">' +
      '<svg viewBox="0 0 24 24" width="26" height="26" fill="#DC2626" stroke="#fff" stroke-width="1.5">' +
      '<path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z"/>' +
      '<circle cx="12" cy="10" r="2.6" fill="#fff" stroke="none"/>' +
      '</svg></div>',
    iconSize: [26, 26],
    iconAnchor: [0, 0],
  });
}

/** يحرّك الكاميرا عند تغيّر المركز (للتتبّع اللحظي). */
function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }): null {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom ?? map.getZoom());
  }, [lat, lng, zoom, map]);
  return null;
}

/** خريطة عرض نقاط (مركبات/شحنة) — OpenStreetMap مجاني بلا مفتاح. */
export function OsmPointsMap({
  points,
  height = 420,
  zoom = 6,
}: {
  points: OsmPoint[];
  height?: number;
  zoom?: number;
}): React.ReactElement {
  const icon = useMemo(() => pinIcon(), []);
  const first = points[0];
  const center: [number, number] = first ? [first.lat, first.lng] : [RIYADH.lat, RIYADH.lng];
  const effectiveZoom = first ? Math.max(zoom, 10) : zoom;

  return (
    <div className="overflow-hidden rounded-xl">
      <MapContainer
        center={center}
        zoom={effectiveZoom}
        style={{ width: '100%', height }}
        scrollWheelZoom
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
        {first && <Recenter lat={first.lat} lng={first.lng} zoom={effectiveZoom} />}
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
            {p.label && <Popup>{p.label}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

/** يلتقط النقر على الخريطة لتحديد الموقع. */
function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }): null {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** خريطة اختيار موقع: نقر أو سحب المؤشر. */
export function OsmPickerMap({
  lat,
  lng,
  zoom = 11,
  height = 256,
  onPick,
}: {
  lat: number;
  lng: number;
  zoom?: number;
  height?: number;
  onPick: (lat: number, lng: number) => void;
}): React.ReactElement {
  const icon = useMemo(() => pinIcon(), []);

  const handleDragEnd = useCallback(
    (e: L.DragEndEvent) => {
      const m = e.target as L.Marker;
      const pos = m.getLatLng();
      onPick(pos.lat, pos.lng);
    },
    [onPick],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200">
      <MapContainer center={[lat, lng]} zoom={zoom} style={{ width: '100%', height }} scrollWheelZoom>
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
        <ClickCatcher onPick={onPick} />
        <Marker
          position={[lat, lng]}
          icon={icon}
          draggable
          eventHandlers={{ dragend: handleDragEnd }}
        />
      </MapContainer>
    </div>
  );
}

