import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Trip as PrismaTrip } from '@prisma/client';
import {
  DriverStatus,
  NotificationType,
  OrderStatus,
  Trip as TripDto,
  TripStatus,
  TripStopStatus,
  UserRole,
  VehicleStatus,
} from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { DeliverStopDto, ReportIssueDto } from './dto/trip.dto';
import { canTripTransition } from './trip-status.machine';

const tripInclude = {
  driver: { include: { user: true } },
  order: { include: { customer: true } },
  stops: { orderBy: { sequenceNumber: 'asc' as const } },
  vehicle: true,
} satisfies Prisma.TripInclude;

type TripFull = Prisma.TripGetPayload<{ include: typeof tripInclude }>;

@Injectable()
export class TripsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async findAll(): Promise<TripDto[]> {
    const rows = await this.prisma.trip.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(TripsService.toDto);
  }

  async findMy(user: AuthenticatedUser): Promise<TripDto[]> {
    const driver = await this.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver) return [];
    const rows = await this.prisma.trip.findMany({
      where: { driverId: driver.id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(TripsService.toDto);
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<TripDto> {
    const trip = await this.getFull(id);
    this.assertCanView(trip, user);
    return TripsService.toDto(trip);
  }

  /** محطات الرحلة (السائق يحتاج معرّفاتها للتسليم). */
  async stops(id: string, user: AuthenticatedUser): Promise<Record<string, unknown>[]> {
    const trip = await this.getFull(id);
    this.assertCanView(trip, user);
    return trip.stops.map((s) => ({
      id: s.id,
      sequenceNumber: s.sequenceNumber,
      address: s.address,
      city: s.city,
      contactName: s.contactName,
      contactPhone: s.contactPhone,
      status: s.status,
      podPhotoUrl: s.podPhotoUrl,
      podSignatureUrl: s.podSignatureUrl,
    }));
  }

  /** السائق يؤكد التحميل: order ASSIGNED → LOADING. */
  async confirmLoading(id: string, user: AuthenticatedUser): Promise<TripDto> {
    const trip = await this.getOwned(id, user);
    this.assertOrder(trip.order.status as OrderStatus, OrderStatus.LOADING);

    await this.prisma.$transaction([
      this.prisma.trip.update({ where: { id }, data: { loadingStartAt: new Date() } }),
      this.prisma.order.update({ where: { id: trip.orderId }, data: { status: OrderStatus.LOADING } }),
    ]);
    this.emitOrder(trip, OrderStatus.LOADING);
    return this.findOneRaw(id);
  }

  /** السائق يبدأ الرحلة: trip → IN_PROGRESS، order LOADING → IN_TRANSIT (يبدأ GPS). */
  async start(id: string, user: AuthenticatedUser): Promise<TripDto> {
    const trip = await this.getOwned(id, user);
    this.assertTrip(trip.status as TripStatus, TripStatus.IN_PROGRESS);
    this.assertOrder(trip.order.status as OrderStatus, OrderStatus.IN_TRANSIT);

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.trip.update({
        where: { id },
        data: { status: TripStatus.IN_PROGRESS, actualStartAt: now, inTransitAt: now },
      }),
      this.prisma.order.update({
        where: { id: trip.orderId },
        data: { status: OrderStatus.IN_TRANSIT },
      }),
    ]);
    this.emitOrder(trip, OrderStatus.IN_TRANSIT);
    return this.findOneRaw(id);
  }

  /** تسليم محطة (+POD). عند تسليم آخر محطة → الرحلة والطلب مكتملان. */
  async deliverStop(
    id: string,
    stopId: string,
    dto: DeliverStopDto,
    user: AuthenticatedUser,
  ): Promise<TripDto> {
    const trip = await this.getOwned(id, user);
    const stop = trip.stops.find((s) => s.id === stopId);
    if (!stop) throw new NotFoundException({ code: 'STOP_NOT_FOUND', message: 'المحطة غير موجودة' });
    if (stop.status === TripStopStatus.DELIVERED) {
      throw new ConflictException({ code: 'STOP_ALREADY_DELIVERED', message: 'المحطة مُسلَّمة مسبقاً' });
    }

    const remainingAfter = trip.stops.filter(
      (s) => s.id !== stopId && s.status !== TripStopStatus.DELIVERED,
    ).length;
    const isLast = remainingAfter === 0;

    await this.prisma.$transaction(async (tx) => {
      await tx.tripStop.update({
        where: { id: stopId },
        data: {
          status: TripStopStatus.DELIVERED,
          actualArrival: new Date(),
          podPhotoUrl: dto.podPhotoUrl ?? stop.podPhotoUrl,
          podSignatureUrl: dto.podSignatureUrl ?? stop.podSignatureUrl,
        },
      });

      if (isLast) {
        const now = new Date();
        await tx.trip.update({
          where: { id },
          data: {
            status: TripStatus.COMPLETED,
            actualEndAt: now,
            deliveredAt: now,
            recipientName: dto.recipientName ?? trip.recipientName,
          },
        });
        // order IN_TRANSIT → DELIVERED → COMPLETED
        await tx.order.update({ where: { id: trip.orderId }, data: { status: OrderStatus.COMPLETED } });
        await tx.driver.update({ where: { id: trip.driverId }, data: { status: DriverStatus.AVAILABLE } });
        await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: VehicleStatus.AVAILABLE } });
      } else {
        await tx.trip.update({ where: { id }, data: { status: TripStatus.AT_STOP } });
      }
    });

    if (isLast) {
      this.emitOrder(trip, OrderStatus.COMPLETED);
      await this.notifications.notify({
        userId: trip.order.customer.userId,
        type: NotificationType.ORDER_STATUS,
        title: 'تم تسليم شحنتك',
        body: 'تم تسليم جميع محطات شحنتك بنجاح',
        referenceType: 'ORDER',
        referenceId: trip.orderId,
      });
    }
    return this.findOneRaw(id);
  }

  /** السائق يبلّغ عن مشكلة → إشعار المشرفين. */
  async reportIssue(id: string, dto: ReportIssueDto, user: AuthenticatedUser): Promise<{ success: boolean }> {
    const trip = await this.getOwned(id, user);
    const supervisors = await this.prisma.user.findMany({
      where: { role: UserRole.SUPERVISOR, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    await Promise.all(
      supervisors.map((s) =>
        this.notifications.notify({
          userId: s.id,
          type: NotificationType.SYSTEM,
          title: 'بلاغ من سائق',
          body: `الرحلة ${trip.id}: ${dto.description}`,
          referenceType: 'TRIP',
          referenceId: trip.id,
        }),
      ),
    );
    return { success: true };
  }

  // ── مساعدات ──

  private async getFull(id: string): Promise<TripFull> {
    const trip = await this.prisma.trip.findUnique({ where: { id }, include: tripInclude });
    if (!trip) throw new NotFoundException({ code: 'TRIP_NOT_FOUND', message: 'الرحلة غير موجودة' });
    return trip;
  }

  private async getOwned(id: string, user: AuthenticatedUser): Promise<TripFull> {
    const trip = await this.getFull(id);
    if (trip.driver.userId !== user.sub) {
      throw new ForbiddenException({ code: 'NOT_TRIP_DRIVER', message: 'ليست رحلتك' });
    }
    return trip;
  }

  private async findOneRaw(id: string): Promise<TripDto> {
    const trip = await this.prisma.trip.findUniqueOrThrow({ where: { id } });
    return TripsService.toDto(trip);
  }

  private assertCanView(trip: TripFull, user: AuthenticatedUser): void {
    if (user.role === UserRole.SUPERVISOR) return;
    if (user.role === UserRole.DRIVER && trip.driver.userId === user.sub) return;
    throw new ForbiddenException({ code: 'FORBIDDEN_TRIP', message: 'ليس لديك صلاحية لهذه الرحلة' });
  }

  private assertTrip(from: TripStatus, to: TripStatus): void {
    if (!canTripTransition(from, to)) {
      throw new ConflictException({
        code: 'INVALID_TRIP_TRANSITION',
        message: `لا يمكن الانتقال بالرحلة من ${from} إلى ${to}`,
      });
    }
  }

  private assertOrder(from: OrderStatus, to: OrderStatus): void {
    // نستخدم منطق order machine عبر المقارنة المباشرة للحالات المتوقعة في تنفيذ الرحلة
    const valid: Record<string, OrderStatus> = {
      [OrderStatus.ASSIGNED]: OrderStatus.LOADING,
      [OrderStatus.LOADING]: OrderStatus.IN_TRANSIT,
      [OrderStatus.IN_TRANSIT]: OrderStatus.COMPLETED,
    };
    if (valid[from] !== to) {
      throw new ConflictException({
        code: 'INVALID_ORDER_STATE',
        message: `حالة الطلب (${from}) لا تسمح بهذا الإجراء`,
      });
    }
  }

  private emitOrder(trip: TripFull, status: OrderStatus): void {
    this.realtime.emitOrderStatusChanged(trip.order.customer.userId, trip.orderId, status);
  }

  static toDto(t: PrismaTrip): TripDto {
    return {
      id: t.id,
      orderId: t.orderId,
      driverId: t.driverId,
      vehicleId: t.vehicleId,
      status: t.status as TripStatus,
      estimatedDistanceKm: t.estimatedDistanceKm === null ? null : Number(t.estimatedDistanceKm),
      actualDistanceKm: t.actualDistanceKm === null ? null : Number(t.actualDistanceKm),
      actualStartAt: t.actualStartAt?.toISOString() ?? null,
      actualEndAt: t.actualEndAt?.toISOString() ?? null,
      totalStops: t.totalStops,
      recipientName: t.recipientName,
      recipientSignatureUrl: t.recipientSignatureUrl,
      notes: t.notes,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
