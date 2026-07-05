import { TripStatus } from '@edham/shared-types';

/**
 * آلة حالة الرحلة (TECH.md §4.3 + SPEC Flow 3):
 * ASSIGNED → IN_PROGRESS → AT_STOP ⇄ IN_PROGRESS → COMPLETED
 * أي حالة نشطة → CANCELLED (بقرار المشرف).
 * السائق لا يرفض الإسناد (Q10) — تبدأ ASSIGNED مباشرة.
 */
const TRANSITIONS: Record<TripStatus, readonly TripStatus[]> = {
  [TripStatus.ASSIGNED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
  [TripStatus.IN_PROGRESS]: [TripStatus.AT_STOP, TripStatus.COMPLETED, TripStatus.CANCELLED],
  [TripStatus.AT_STOP]: [TripStatus.IN_PROGRESS, TripStatus.COMPLETED, TripStatus.CANCELLED],
  [TripStatus.COMPLETED]: [],
  [TripStatus.CANCELLED]: [],
};

export function canTripTransition(from: TripStatus, to: TripStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function isTripTerminal(status: TripStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
