import { TemperatureCapability, TemperatureType } from '@edham/shared-types';
import { isTemperatureCompatible } from './temperature-match';

describe('قاعدة توافق التبريد (Q9)', () => {
  it('بدون تبريد → أي مركبة متوافقة', () => {
    expect(isTemperatureCompatible(null, TemperatureCapability.REFRIGERATED)).toBe(true);
    expect(isTemperatureCompatible(null, TemperatureCapability.FROZEN)).toBe(true);
    expect(isTemperatureCompatible(null, TemperatureCapability.BOTH)).toBe(true);
  });

  it('FROZEN → FROZEN أو BOTH فقط', () => {
    expect(isTemperatureCompatible(TemperatureType.FROZEN, TemperatureCapability.FROZEN)).toBe(true);
    expect(isTemperatureCompatible(TemperatureType.FROZEN, TemperatureCapability.BOTH)).toBe(true);
    expect(isTemperatureCompatible(TemperatureType.FROZEN, TemperatureCapability.REFRIGERATED)).toBe(
      false,
    );
  });

  it('REFRIGERATED → REFRIGERATED أو BOTH فقط', () => {
    expect(
      isTemperatureCompatible(TemperatureType.REFRIGERATED, TemperatureCapability.REFRIGERATED),
    ).toBe(true);
    expect(isTemperatureCompatible(TemperatureType.REFRIGERATED, TemperatureCapability.BOTH)).toBe(
      true,
    );
    expect(isTemperatureCompatible(TemperatureType.REFRIGERATED, TemperatureCapability.FROZEN)).toBe(
      false,
    );
  });
});
