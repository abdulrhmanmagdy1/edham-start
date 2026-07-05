import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TemperatureLog as PrismaTempLog } from '@prisma/client';
import {
  NotificationType,
  TemperatureLog as TempLogDto,
  UserRole,
} from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateTemperatureLogDto } from './dto/temperature-log.dto';
import { isTemperatureViolation } from './violation';

@Injectable()
export class ColdChainService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /** DRIVER يسجّل قراءة حرارة؛ يُحسب الانتهاك ويُنبَّه المعنيون. */
  async create(dto: CreateTemperatureLogDto, user: AuthenticatedUser): Promise<TempLogDto> {
    const driver = await this.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver) throw new ForbiddenException({ code: 'NOT_DRIVER', message: 'ليس سائقاً' });

    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      include: { order: { include: { customer: true } } },
    });
    if (!trip) throw new NotFoundException({ code: 'TRIP_NOT_FOUND', message: 'الرحلة غير موجودة' });
    if (trip.driverId !== driver.id) {
      throw new ForbiddenException({ code: 'NOT_TRIP_DRIVER', message: 'ليست رحلتك' });
    }

    const min = trip.order.tempMinCelsius === null ? null : Number(trip.order.tempMinCelsius);
    const max = trip.order.tempMaxCelsius === null ? null : Number(trip.order.tempMaxCelsius);
    const isViolation = isTemperatureViolation(dto.temperatureCelsius, min, max);

    const log = await this.prisma.temperatureLog.create({
      data: {
        tripId: trip.id,
        driverId: driver.id,
        temperatureCelsius: dto.temperatureCelsius,
        isViolation,
        notes: dto.notes ?? null,
        recordedAt: new Date(),
      },
    });

    if (isViolation) {
      const customerUserId = trip.order.customer.userId;
      await this.notifyViolation(trip.orderId, dto.temperatureCelsius, driver.userId, customerUserId);
      this.realtime.emitColdChainAlert(customerUserId, trip.orderId, dto.temperatureCelsius);
    }

    return ColdChainService.toDto(log);
  }

  async findByTrip(tripId: string, user: AuthenticatedUser): Promise<TempLogDto[]> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: true, order: { include: { customer: true } } },
    });
    if (!trip) throw new NotFoundException({ code: 'TRIP_NOT_FOUND', message: 'الرحلة غير موجودة' });

    const allowed =
      user.role === UserRole.SUPERVISOR ||
      (user.role === UserRole.DRIVER && trip.driver.userId === user.sub) ||
      (user.role === UserRole.CUSTOMER && trip.order.customer.userId === user.sub);
    if (!allowed) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'ليس لديك صلاحية' });
    }

    const rows = await this.prisma.temperatureLog.findMany({
      where: { tripId },
      orderBy: { recordedAt: 'desc' },
    });
    return rows.map(ColdChainService.toDto);
  }

  private async notifyViolation(
    orderId: string,
    temperature: number,
    driverUserId: string,
    customerUserId: string,
  ): Promise<void> {
    const supervisors = await this.prisma.user.findMany({
      where: { role: UserRole.SUPERVISOR, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    const targets = [...supervisors.map((s) => s.id), driverUserId, customerUserId];
    await Promise.all(
      targets.map((userId) =>
        this.notifications.notify({
          userId,
          type: NotificationType.COLD_CHAIN_ALERT,
          title: 'تنبيه سلسلة التبريد',
          body: `قراءة حرارة خارج النطاق: ${temperature}°C`,
          referenceType: 'ORDER',
          referenceId: orderId,
        }),
      ),
    );
  }

  static toDto(l: PrismaTempLog): TempLogDto {
    return {
      id: l.id,
      tripId: l.tripId,
      driverId: l.driverId,
      temperatureCelsius: Number(l.temperatureCelsius),
      isViolation: l.isViolation,
      notes: l.notes,
      isOfflineSynced: l.isOfflineSynced,
      recordedAt: l.recordedAt.toISOString(),
      syncedAt: l.syncedAt?.toISOString() ?? null,
    };
  }
}
