/**
 * ترميز عكسي (إحداثيات → عنوان) عبر Nominatim من OpenStreetMap — مجاني بلا مفتاح.
 * ملف مستقل بلا Leaflet حتى لا يُحمَّل المتصفح وقت SSR.
 */
export async function reverseGeocodeOsm(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) throw new Error('geocode failed');
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}
