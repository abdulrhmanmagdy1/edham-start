import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LocationPoint as PrismaLocation } from '@prisma/client';
import { LocationPoint as LocationDto, UserRole } from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateLocationsDto } from './dto/location.dto';

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /** DRIVER يرسل نقاط GPS (تقبل دفعة للـ offline sync). */
  async ingest(dto: CreateLocationsDto, user: AuthenticatedUser): Promise<{ count: number }> {
    const driver = await this.prisma.driver.findUnique({ where: { userId: user.sub } });
    if (!driver) throw new ForbiddenException({ code: 'NOT_DRIVER', message: 'ليس سائقاً' });

    const trip = await this.prisma.trip.findUnique({ where: { id: dto.tripId } });
    if (!trip) throw new NotFoundException({ code: 'TRIP_NOT_FOUND', message: 'الرحلة غير موجودة' });
    if (trip.driverId !== driver.id) {
      throw new ForbiddenException({ code: 'NOT_TRIP_DRIVER', message: 'ليست رحلتك' });
    }

    const now = new Date();
    const sorted = [...dto.points].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );

    await this.prisma.locationPoint.createMany({
      data: sorted.map((p) => ({
        vehicleId: trip.vehicleId,
        tripId: trip.id,
        lat: p.lat,
        lng: p.lng,
        accuracyMeters: p.accuracyMeters ?? null,
        speedKmh: p.speedKmh ?? null,
        bearingDegrees: p.bearingDegrees ?? null,
        isOfflineSynced: new Date(p.recordedAt).getTime() < now.getTime() - 60_000,
        recordedAt: new Date(p.recordedAt),
        syncedAt: now,
      })),
    });

    // بث آخر نقطة للمشرفين (الخريطة الحية)
    const last = sorted[sorted.length - 1];
    this.realtime.emitDriverLocation(trip.driverId, last.lat, last.lng);

    return { count: sorted.length };
  }

  async findByTrip(tripId: string, user: AuthenticatedUser): Promise<LocationDto[]> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { order: { include: { customer: true } } },
    });
    if (!trip) throw new NotFoundException({ code: 'TRIP_NOT_FOUND', message: 'الرحلة غير موجودة' });
    if (
      user.role === UserRole.CUSTOMER &&
      trip.order.customer.userId !== user.sub
    ) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'ليس لديك صلاحية' });
    }

    const rows = await this.prisma.locationPoint.findMany({
      where: { tripId },
      orderBy: { recordedAt: 'asc' },
    });
    return rows.map(LocationsService.toDto);
  }

  /** آخر موقع لكل مركبة (خريطة الأسطول — SUPERVISOR). */
  async fleet(): Promise<LocationDto[]> {
    const rows = await this.prisma.locationPoint.findMany({
      distinct: ['vehicleId'],
      orderBy: { recordedAt: 'desc' },
    });
    return rows.map(LocationsService.toDto);
  }

  static toDto(l: PrismaLocation): LocationDto {
    return {
      id: l.id,
      vehicleId: l.vehicleId,
      tripId: l.tripId,
      lat: Number(l.lat),
      lng: Number(l.lng),
      accuracyMeters: l.accuracyMeters === null ? null : Number(l.accuracyMeters),
      speedKmh: l.speedKmh === null ? null : Number(l.speedKmh),
      bearingDegrees: l.bearingDegrees === null ? null : Number(l.bearingDegrees),
      isOfflineSynced: l.isOfflineSynced,
      recordedAt: l.recordedAt.toISOString(),
      syncedAt: l.syncedAt?.toISOString() ?? null,
    };
  }
}
