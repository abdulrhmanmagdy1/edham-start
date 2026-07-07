/** إعدادات تطبيق الويب. */
export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3000',
  mapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  /** وضع التجربة: يُظهر رمز OTP على الشاشة (للعروض فقط — أطفئه في الإنتاج الحقيقي). */
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
} as const;
