import { OrderStatus } from '@edham/shared-types';
import { allowedTransitions, canTransition, isTerminal } from './order-status.machine';

describe('Order state machine', () => {
  it('يسمح بالمسار السعيد الكامل', () => {
    const happyPath: [OrderStatus, OrderStatus][] = [
      [OrderStatus.DRAFT, OrderStatus.PENDING_PRICING],
      [OrderStatus.PENDING_PRICING, OrderStatus.PRICED],
      [OrderStatus.PRICED, OrderStatus.CUSTOMER_CONFIRMED],
      [OrderStatus.CUSTOMER_CONFIRMED, OrderStatus.ASSIGNED],
      [OrderStatus.ASSIGNED, OrderStatus.LOADING],
      [OrderStatus.LOADING, OrderStatus.IN_TRANSIT],
      [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
    ];
    for (const [from, to] of happyPath) {
      expect(canTransition(from, to)).toBe(true);
    }
  });

  it('فلو التسعير: PENDING_PRICING → PRICED فقط (لا قفز)', () => {
    expect(canTransition(OrderStatus.PENDING_PRICING, OrderStatus.PRICED)).toBe(true);
    expect(canTransition(OrderStatus.PENDING_PRICING, OrderStatus.CUSTOMER_CONFIRMED)).toBe(false);
    expect(canTransition(OrderStatus.PENDING_PRICING, OrderStatus.ASSIGNED)).toBe(false);
  });

  it('العميل يقبل: PRICED → CUSTOMER_CONFIRMED، ويرفض: PRICED → CANCELLED', () => {
    expect(canTransition(OrderStatus.PRICED, OrderStatus.CUSTOMER_CONFIRMED)).toBe(true);
    expect(canTransition(OrderStatus.PRICED, OrderStatus.CANCELLED)).toBe(true);
  });

  it('لا إلغاء بعد IN_TRANSIT', () => {
    expect(canTransition(OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED)).toBe(false);
    expect(canTransition(OrderStatus.DELIVERED, OrderStatus.CANCELLED)).toBe(false);
  });

  it('الإلغاء مسموح من الحالات المبكرة حتى LOADING', () => {
    for (const s of [
      OrderStatus.PENDING_PRICING,
      OrderStatus.PRICED,
      OrderStatus.CUSTOMER_CONFIRMED,
      OrderStatus.ASSIGNED,
      OrderStatus.LOADING,
    ]) {
      expect(canTransition(s, OrderStatus.CANCELLED)).toBe(true);
    }
  });

  it('COMPLETED و CANCELLED نهائيتان', () => {
    expect(isTerminal(OrderStatus.COMPLETED)).toBe(true);
    expect(isTerminal(OrderStatus.CANCELLED)).toBe(true);
    expect(allowedTransitions(OrderStatus.COMPLETED)).toHaveLength(0);
  });

  it('يرفض الرجوع للخلف', () => {
    expect(canTransition(OrderStatus.PRICED, OrderStatus.PENDING_PRICING)).toBe(false);
    expect(canTransition(OrderStatus.COMPLETED, OrderStatus.IN_TRANSIT)).toBe(false);
  });
});
