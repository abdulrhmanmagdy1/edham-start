import { TemperatureCapability, TemperatureType } from '@edham/shared-types';

/**
 * قاعدة توافق التبريد (Q9 / TECH.md §4.2):
 * - FROZEN → المركبة يجب أن تكون FROZEN أو BOTH
 * - REFRIGERATED → REFRIGERATED أو BOTH
 * - بدون تبريد (null) → أي مركبة
 */
export function isTemperatureCompatible(
  required: TemperatureType | null,
  capability: TemperatureCapability,
): boolean {
  if (required === null) return true;
  if (capability === TemperatureCapability.BOTH) return true;
  if (required === TemperatureType.FROZEN) return capability === TemperatureCapability.FROZEN;
  if (required === TemperatureType.REFRIGERATED) {
    return capability === TemperatureCapability.REFRIGERATED;
  }
  return false;
}
