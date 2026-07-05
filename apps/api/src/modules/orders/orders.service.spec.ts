import { ConflictException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, UserRole } from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { OrdersService } from './orders.service';

type MockPrisma = {
  order: { findFirst: jest.Mock; update: jest.Mock };
  user: { findMany: jest.Mock };
};

function makeOrder(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const now = new Date();
  return {
    id: '11111111-1111-1111-1111-111111111111',
    customerId: 'c1',
    pickupAddress: 'الرياض',
    pickupLat: 24.7,
    pickupLng: 46.6,
    deliveryAddress: 'جدة',
    deliveryLat: 21.5,
    deliveryLng: 39.2,
    cargoType: 'DRY',
    cargoWeightKg: 100,
    cargoDescription: null,
    vehicleTypeRequired: 'HIACE_VAN',
    coldChainRequired: false,
    temperatureType: null,
    tempMinCelsius: null,
    tempMaxCelsius: null,
    quotedPrice: null,
    pricingNotes: null,
    pricingSentAt: null,
    currency: 'SAR',
    status: OrderStatus.PENDING_PRICING,
    cancellationReason: null,
    scheduledAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const supervisor: AuthenticatedUser = { sub: 'sup-1', role: UserRole.SUPERVISOR };
const customer: AuthenticatedUser = { sub: 'user-1', role: UserRole.CUSTOMER };

describe('OrdersService — فلو التسعير (PRE-001)', () => {
  let prisma: MockPrisma;
  let notifications: { notify: jest.Mock };
  let email: { sendPricingEmail: jest.Mock };
  let service: OrdersService;

  beforeEach(() => {
    prisma = {
      order: { findFirst: jest.fn(), update: jest.fn() },
      user: { findMany: jest.fn().mockResolvedValue([{ id: 'sup-1' }]) },
    };
    notifications = { notify: jest.fn().mockResolvedValue(undefined) };
    email = { sendPricingEmail: jest.fn().mockResolvedValue(undefined) };
    service = new OrdersService(
      prisma as never,
      notifications as never,
      email as never,
    );
  });

  it('setPrice على PENDING_PRICING → PRICED + إيميل + إشعار', async () => {
    prisma.order.findFirst.mockResolvedValue(makeOrder({ status: OrderStatus.PENDING_PRICING }));
    prisma.order.update.mockResolvedValue(
      makeOrder({
        status: OrderStatus.PRICED,
        quotedPrice: 500,
        pricingSentAt: new Date(),
        customer: { userId: 'user-1', billingEmail: 'bill@co.sa', user: { email: null } },
      }),
    );

    const result = await service.setPrice('id', { quotedPrice: 500 }, supervisor);

    expect(result.status).toBe(OrderStatus.PRICED);
    expect(email.sendPricingEmail).toHaveBeenCalledTimes(1);
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'PRICE_SENT', userId: 'user-1' }),
    );
  });

  it('setPrice على طلب PRICED مسبقاً → ConflictException (لا إعادة تسعير)', async () => {
    prisma.order.findFirst.mockResolvedValue(makeOrder({ status: OrderStatus.PRICED }));
    await expect(service.setPrice('id', { quotedPrice: 500 }, supervisor)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('acceptPrice من غير المالك → ForbiddenException', async () => {
    prisma.order.findFirst.mockResolvedValue(
      makeOrder({ status: OrderStatus.PRICED, customer: { userId: 'someone-else' } }),
    );
    await expect(service.acceptPrice('id', customer)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('acceptPrice من المالك على PRICED → CUSTOMER_CONFIRMED', async () => {
    prisma.order.findFirst.mockResolvedValue(
      makeOrder({ status: OrderStatus.PRICED, customer: { userId: 'user-1' } }),
    );
    prisma.order.update.mockResolvedValue(makeOrder({ status: OrderStatus.CUSTOMER_CONFIRMED }));

    const result = await service.acceptPrice('id', customer);
    expect(result.status).toBe(OrderStatus.CUSTOMER_CONFIRMED);
  });

  it('rejectPrice من المالك على PRICED → CANCELLED', async () => {
    prisma.order.findFirst.mockResolvedValue(
      makeOrder({ status: OrderStatus.PRICED, customer: { userId: 'user-1' } }),
    );
    prisma.order.update.mockResolvedValue(makeOrder({ status: OrderStatus.CANCELLED }));

    const result = await service.rejectPrice('id', customer);
    expect(result.status).toBe(OrderStatus.CANCELLED);
  });

  it('acceptPrice على PENDING_PRICING (قبل التسعير) → ConflictException', async () => {
    prisma.order.findFirst.mockResolvedValue(
      makeOrder({ status: OrderStatus.PENDING_PRICING, customer: { userId: 'user-1' } }),
    );
    await expect(service.acceptPrice('id', customer)).rejects.toBeInstanceOf(ConflictException);
  });
});
