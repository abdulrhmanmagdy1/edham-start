import { OrderStatus } from '@edham/shared-types';

/**
 * آلة حالة الطلب (BRAIN.md + SPEC §4 Feature 1):
 * DRAFT → PENDING_PRICING → PRICED → CUSTOMER_CONFIRMED → ASSIGNED → LOADING → IN_TRANSIT → DELIVERED → COMPLETED
 * PRICED → CANCELLED (رفض العميل)
 * الإلغاء ممكن حتى LOADING؛ بعد IN_TRANSIT لا إلغاء (SPEC: لا تعديل بعد "في الطريق").
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.PENDING_PRICING, OrderStatus.CANCELLED],
  [OrderStatus.PENDING_PRICING]: [OrderStatus.PRICED, OrderStatus.CANCELLED],
  [OrderStatus.PRICED]: [OrderStatus.CUSTOMER_CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CUSTOMER_CONFIRMED]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]: [OrderStatus.LOADING, OrderStatus.CANCELLED],
  [OrderStatus.LOADING]: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function allowedTransitions(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from];
}

export function isTerminal(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
