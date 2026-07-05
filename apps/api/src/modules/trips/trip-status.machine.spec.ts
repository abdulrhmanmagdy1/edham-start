import { TripStatus } from '@edham/shared-types';
import { canTripTransition, isTripTerminal } from './trip-status.machine';

describe('Trip state machine', () => {
  it('المسار: ASSIGNED → IN_PROGRESS → COMPLETED', () => {
    expect(canTripTransition(TripStatus.ASSIGNED, TripStatus.IN_PROGRESS)).toBe(true);
    expect(canTripTransition(TripStatus.IN_PROGRESS, TripStatus.COMPLETED)).toBe(true);
  });

  it('AT_STOP ذهاباً وإياباً مع IN_PROGRESS', () => {
    expect(canTripTransition(TripStatus.IN_PROGRESS, TripStatus.AT_STOP)).toBe(true);
    expect(canTripTransition(TripStatus.AT_STOP, TripStatus.IN_PROGRESS)).toBe(true);
    expect(canTripTransition(TripStatus.AT_STOP, TripStatus.COMPLETED)).toBe(true);
  });

  it('لا يبدأ من COMPLETED ولا يقفز من ASSIGNED إلى COMPLETED', () => {
    expect(canTripTransition(TripStatus.ASSIGNED, TripStatus.COMPLETED)).toBe(false);
    expect(canTripTransition(TripStatus.COMPLETED, TripStatus.IN_PROGRESS)).toBe(false);
  });

  it('COMPLETED و CANCELLED نهائيتان', () => {
    expect(isTripTerminal(TripStatus.COMPLETED)).toBe(true);
    expect(isTripTerminal(TripStatus.CANCELLED)).toBe(true);
  });
});
