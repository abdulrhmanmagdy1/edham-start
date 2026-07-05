import { isTemperatureViolation } from './violation';

describe('كشف انتهاك سلسلة التبريد', () => {
  it('مبرّد 2..8: القراءات داخل النطاق سليمة', () => {
    expect(isTemperatureViolation(5, 2, 8)).toBe(false);
    expect(isTemperatureViolation(2, 2, 8)).toBe(false);
    expect(isTemperatureViolation(8, 2, 8)).toBe(false);
  });

  it('مبرّد 2..8: خارج النطاق انتهاك', () => {
    expect(isTemperatureViolation(9, 2, 8)).toBe(true);
    expect(isTemperatureViolation(1, 2, 8)).toBe(true);
  });

  it('مجمّد -25..-18: القراءة -30 (أبرد) و -10 (أدفأ) انتهاك', () => {
    expect(isTemperatureViolation(-20, -25, -18)).toBe(false);
    expect(isTemperatureViolation(-10, -25, -18)).toBe(true);
    expect(isTemperatureViolation(-30, -25, -18)).toBe(true);
  });

  it('بلا نطاق (غير مبردة) → لا انتهاك', () => {
    expect(isTemperatureViolation(50, null, null)).toBe(false);
  });
});
