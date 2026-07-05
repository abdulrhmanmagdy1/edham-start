import { Injectable, NotFoundException } from '@nestjs/common';
import { MaintenanceRequest as PrismaMaintenance } from '@prisma/client';
import {
  MaintenanceStatus,
  NotificationType,
  UserRole,
  VehicleStatus,
} from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMaintenanceDto, UpdateMaintenanceStatusDto } from './dto/maintenance.dto';

const withVehicle = { vehicle: { select: { plateNumber: true } } };

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** WORKSHOP أو DRIVER ينشئ طلب صيانة. */
  async create(dto: CreateMaintenanceDto, user: AuthenticatedUser): Promise<PrismaMaintenance> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException({ code: 'VEHICLE_NOT_FOUND', message: 'المركبة غير موجودة' });

    const request = await this.prisma.maintenanceRequest.create({
      data: {
        vehicleId: dto.vehicleId,
        type: dto.type,
        description: dto.description,
        reportedBy: user.sub,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status: MaintenanceStatus.OPEN,
      },
      include: withVehicle,
    });

    await this.notifySupervisors(
      'طلب صيانة جديد',
      `طلب صيانة (${dto.type}) للمركبة ${vehicle.plateNumber}`,
      request.id,
    );
    return request;
  }

  findAll(): Promise<PrismaMaintenance[]> {
    return this.prisma.maintenanceRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: withVehicle,
    });
  }

  findByVehicle(vehicleId: string): Promise<PrismaMaintenance[]> {
    return this.prisma.maintenanceRequest.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'desc' },
      include: withVehicle,
    });
  }

  async findOne(id: string): Promise<PrismaMaintenance> {
    const req = await this.prisma.maintenanceRequest.findUnique({ where: { id }, include: withVehicle });
    if (!req) throw new NotFoundException({ code: 'MAINTENANCE_NOT_FOUND', message: 'طلب الصيانة غير موجود' });
    return req;
  }

  /** WORKSHOP يحدّث الحالة؛ IN_PROGRESS → المركبة IN_MAINTENANCE، COMPLETED → AVAILABLE. */
  async updateStatus(id: string, dto: UpdateMaintenanceStatusDto): Promise<PrismaMaintenance> {
    const req = await this.findOne(id);

    const vehicleStatus: VehicleStatus | null =
      dto.status === MaintenanceStatus.IN_PROGRESS
        ? VehicleStatus.IN_MAINTENANCE
        : dto.status === MaintenanceStatus.COMPLETED
          ? VehicleStatus.AVAILABLE
          : null;

    const [updated] = await this.prisma.$transaction([
      this.prisma.maintenanceRequest.update({
        where: { id },
        data: {
          status: dto.status,
          cost: dto.cost ?? undefined,
          notes: dto.notes ?? undefined,
          completedAt: dto.status === MaintenanceStatus.COMPLETED ? new Date() : undefined,
        },
        include: withVehicle,
      }),
      ...(vehicleStatus
        ? [
            this.prisma.vehicle.update({
              where: { id: req.vehicleId },
              data: {
                status: vehicleStatus,
                lastMaintenanceDate:
                  dto.status === MaintenanceStatus.COMPLETED ? new Date() : undefined,
              },
            }),
          ]
        : []),
    ]);
    return updated;
  }

  private async notifySupervisors(title: string, body: string, refId: string): Promise<void> {
    const supervisors = await this.prisma.user.findMany({
      where: { role: UserRole.SUPERVISOR, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    await Promise.all(
      supervisors.map((s) =>
        this.notifications.notify({
          userId: s.id,
          type: NotificationType.MAINTENANCE_REMINDER,
          title,
          body,
          referenceType: 'VEHICLE',
          referenceId: refId,
        }),
      ),
    );
  }

  static toDto(m: PrismaMaintenance & { vehicle?: { plateNumber: string } }): Record<string, unknown> {
    return {
      id: m.id,
      vehicleId: m.vehicleId,
      vehicle: m.vehicle ? { plateNumber: m.vehicle.plateNumber } : null,
      type: m.type,
      description: m.description,
      status: m.status,
      cost: m.cost === null ? null : Number(m.cost),
      scheduledAt: m.scheduledAt?.toISOString() ?? null,
      completedAt: m.completedAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
