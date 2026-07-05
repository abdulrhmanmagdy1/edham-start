/**
 * كشف انتهاك سلسلة التبريد (SPEC Feature 4).
 * القراءة انتهاك لو خرجت عن نطاق [min, max] المضبوط حسب نوع الشحنة.
 * لو لا يوجد نطاق (شحنة غير مبردة) → لا انتهاك.
 */
export function isTemperatureViolation(
  reading: number,
  min: number | null,
  max: number | null,
): boolean {
  if (min === null && max === null) return false;
  if (min !== null && reading < min) return true;
  if (max !== null && reading > max) return true;
  return false;
}
