import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Order as PrismaOrder } from '@prisma/client';
import {
  NotificationType,
  Order as OrderDto,
  OrderStatus,
  PaginationMeta,
  TemperatureType,
  UserRole,
} from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from '../messaging/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { SetPriceDto, UpdateOrderStatusDto } from './dto/pricing.dto';
import { canTransition } from './order-status.machine';

// نطاقات درجات الحرارة الافتراضية (SPEC §5.2)
const TEMP_RANGES: Record<TemperatureType, { min: number; max: number }> = {
  [TemperatureType.REFRIGERATED]: { min: 2, max: 8 },
  [TemperatureType.FROZEN]: { min: -25, max: -18 },
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  // ── إنشاء الطلب (CUSTOMER) → PENDING_PRICING ──
  async create(dto: CreateOrderDto, user: AuthenticatedUser): Promise<OrderDto> {
    const customer = await this.prisma.customer.findFirst({ where: { userId: user.sub } });
    if (!customer) {
      throw new ForbiddenException({
        code: 'NO_CUSTOMER_PROFILE',
        message: 'لا يوجد ملف شركة مرتبط بحسابك',
      });
    }

    if (dto.coldChainRequired && !dto.temperatureType) {
      throw new BadRequestException({
        code: 'TEMPERATURE_TYPE_REQUIRED',
        message: 'نوع التبريد مطلوب للشحنة المبردة/المجمدة',
      });
    }

    const stops = [...dto.stops].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    const lastStop = stops[stops.length - 1];
    const range = dto.temperatureType ? TEMP_RANGES[dto.temperatureType] : null;

    const created = await this.prisma.order.create({
      data: {
        customerId: customer.id,
        pickupAddress: dto.pickup.address,
        pickupLat: dto.pickup.lat,
        pickupLng: dto.pickup.lng,
        deliveryAddress: lastStop.address,
        deliveryLat: lastStop.lat,
        deliveryLng: lastStop.lng,
        cargoType: dto.cargoType,
        cargoWeightKg: dto.cargoWeightKg,
        cargoDescription: dto.cargoDescription ?? null,
        vehicleTypeRequired: dto.vehicleTypeRequired,
        coldChainRequired: dto.coldChainRequired,
        temperatureType: dto.temperatureType ?? null,
        tempMinCelsius: range?.min ?? null,
        tempMaxCelsius: range?.max ?? null,
        currency: 'SAR',
        status: OrderStatus.PENDING_PRICING,
        scheduledAt: new Date(dto.scheduledAt),
        stops: {
          create: stops.map((s) => ({
            sequenceNumber: s.sequenceNumber,
            address: s.address,
            city: s.city ?? null,
            latitude: s.lat,
            longitude: s.lng,
            contactName: s.contactName ?? null,
            contactPhone: s.contactPhone ?? null,
            scheduledArrival: s.scheduledArrival ? new Date(s.scheduledArrival) : null,
          })),
        },
      },
    });

    await this.notifySupervisors(
      NotificationType.ORDER_STATUS,
      'طلب جديد بانتظار التسعير',
      `طلب جديد من ${customer.companyName} يحتاج تسعيراً`,
      created.id,
    );

    return OrdersService.toDto(created);
  }

  // ── قوائم ──
  async findAll(query: OrderQueryDto): Promise<{ data: OrderDto[]; meta: PaginationMeta }> {
    const where: Prisma.OrderWhereInput = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;
    if (query.vehicleType) where.vehicleTypeRequired = query.vehicleType;
    if (query.temperatureType) where.temperatureType = query.temperatureType;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return {
      data: rows.map(OrdersService.toDto),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findMy(user: AuthenticatedUser): Promise<OrderDto[]> {
    const customer = await this.prisma.customer.findFirst({ where: { userId: user.sub } });
    if (!customer) return [];
    const rows = await this.prisma.order.findMany({
      where: { customerId: customer.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(OrdersService.toDto);
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<OrderDto> {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: { customer: true, trip: { include: { driver: true } } },
    });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });

    this.assertCanView(order, user);
    return OrdersService.toDto(order);
  }

  // ── فلو التسعير (PRE-001) ──

  /** المشرف يحدد السعر يدوياً → PRICED → إيميل للعميل. */
  async setPrice(id: string, dto: SetPriceDto, _user: AuthenticatedUser): Promise<OrderDto> {
    const order = await this.getOr404(id);
    this.assertTransition(order.status as OrderStatus, OrderStatus.PRICED);

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        quotedPrice: dto.quotedPrice,
        pricingNotes: dto.pricingNotes ?? null,
        pricingSentAt: new Date(),
        status: OrderStatus.PRICED,
      },
      include: { customer: { include: { user: true } } },
    });

    const billingEmail = updated.customer.billingEmail ?? updated.customer.user.email;
    if (billingEmail) {
      await this.email.sendPricingEmail({
        to: billingEmail,
        orderId: updated.id,
        quotedPrice: dto.quotedPrice,
        currency: updated.currency,
        pricingNotes: dto.pricingNotes,
      });
    }
    await this.notifications.notify({
      userId: updated.customer.userId,
      type: NotificationType.PRICE_SENT,
      title: 'تم إرسال عرض السعر',
      body: `عرض سعر لطلبك: ${dto.quotedPrice} ${updated.currency} (قبل الضريبة)`,
      referenceType: 'ORDER',
      referenceId: updated.id,
    });

    return OrdersService.toDto(updated);
  }

  /** العميل يقبل السعر → CUSTOMER_CONFIRMED. */
  async acceptPrice(id: string, user: AuthenticatedUser): Promise<OrderDto> {
    const order = await this.getOwnedOrder(id, user);
    this.assertTransition(order.status as OrderStatus, OrderStatus.CUSTOMER_CONFIRMED);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CUSTOMER_CONFIRMED },
    });
    await this.notifySupervisors(
      NotificationType.PRICE_ACCEPTED,
      'العميل قبل السعر',
      `تم قبول سعر الطلب ${updated.id} — جاهز للإسناد`,
      updated.id,
    );
    return OrdersService.toDto(updated);
  }

  /** العميل يرفض السعر → CANCELLED. */
  async rejectPrice(id: string, user: AuthenticatedUser): Promise<OrderDto> {
    const order = await this.getOwnedOrder(id, user);
    this.assertTransition(order.status as OrderStatus, OrderStatus.CANCELLED);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED, cancellationReason: 'رفض العميل السعر' },
    });
    await this.notifySupervisors(
      NotificationType.PRICE_REJECTED,
      'العميل رفض السعر',
      `تم رفض سعر الطلب ${updated.id} — أُلغي الطلب`,
      updated.id,
    );
    return OrdersService.toDto(updated);
  }

  /** تغيير حالة يدوي (المشرف) — يُتحقَّق منه بآلة الحالة. */
  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    _user: AuthenticatedUser,
  ): Promise<OrderDto> {
    const order = await this.getOr404(id);
    this.assertTransition(order.status as OrderStatus, dto.status);

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        cancellationReason:
          dto.status === OrderStatus.CANCELLED ? (dto.cancellationReason ?? null) : undefined,
      },
    });
    return OrdersService.toDto(updated);
  }

  // ── مساعدات داخلية ──

  private async getOr404(id: string): Promise<PrismaOrder> {
    const order = await this.prisma.order.findFirst({ where: { id, deletedAt: null } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    return order;
  }

  private async getOwnedOrder(id: string, user: AuthenticatedUser): Promise<PrismaOrder> {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'الطلب غير موجود' });
    if (order.customer.userId !== user.sub) {
      throw new ForbiddenException({ code: 'NOT_ORDER_OWNER', message: 'ليس طلبك' });
    }
    return order;
  }

  private assertTransition(from: OrderStatus, to: OrderStatus): void {
    if (!canTransition(from, to)) {
      throw new ConflictException({
        code: 'INVALID_STATUS_TRANSITION',
        message: `لا يمكن الانتقال من ${from} إلى ${to}`,
      });
    }
  }

  private assertCanView(
    order: PrismaOrder & { customer: { userId: string }; trip: { driver: { userId: string } } | null },
    user: AuthenticatedUser,
  ): void {
    if (user.role === UserRole.SUPERVISOR || user.role === UserRole.ACCOUNTANT) return;
    if (user.role === UserRole.CUSTOMER && order.customer.userId === user.sub) return;
    if (user.role === UserRole.DRIVER && order.trip?.driver.userId === user.sub) return;
    throw new ForbiddenException({ code: 'FORBIDDEN_ORDER', message: 'ليس لديك صلاحية لهذا الطلب' });
  }

  private async notifySupervisors(
    type: NotificationType,
    title: string,
    body: string,
    orderId: string,
  ): Promise<void> {
    const supervisors = await this.prisma.user.findMany({
      where: { role: UserRole.SUPERVISOR, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    await Promise.all(
      supervisors.map((s) =>
        this.notifications.notify({ userId: s.id, type, title, body, referenceType: 'ORDER', referenceId: orderId }),
      ),
    );
  }

  private static num(value: Prisma.Decimal | null): number | null {
    return value === null ? null : Number(value);
  }

  static toDto(order: PrismaOrder): OrderDto {
    return {
      id: order.id,
      customerId: order.customerId,
      pickupAddress: order.pickupAddress,
      pickupLat: Number(order.pickupLat),
      pickupLng: Number(order.pickupLng),
      deliveryAddress: order.deliveryAddress,
      deliveryLat: Number(order.deliveryLat),
      deliveryLng: Number(order.deliveryLng),
      cargoType: order.cargoType as OrderDto['cargoType'],
      cargoWeightKg: Number(order.cargoWeightKg),
      cargoDescription: order.cargoDescription,
      vehicleTypeRequired: order.vehicleTypeRequired as OrderDto['vehicleTypeRequired'],
      coldChainRequired: order.coldChainRequired,
      temperatureType: (order.temperatureType as TemperatureType | null) ?? null,
      tempMinCelsius: OrdersService.num(order.tempMinCelsius),
      tempMaxCelsius: OrdersService.num(order.tempMaxCelsius),
      quotedPrice: OrdersService.num(order.quotedPrice),
      pricingNotes: order.pricingNotes,
      pricingSentAt: order.pricingSentAt?.toISOString() ?? null,
      currency: order.currency,
      status: order.status as OrderStatus,
      cancellationReason: order.cancellationReason,
      scheduledAt: order.scheduledAt.toISOString(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}
