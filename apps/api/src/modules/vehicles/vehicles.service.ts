import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Vehicle as PrismaVehicle } from '@prisma/client';
import {
  TemperatureCapability,
  TemperatureType,
  Vehicle as VehicleDto,
  VehicleStatus,
  VehicleType,
} from '@edham/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toCsv } from '../../common/util/csv';
import { AvailableVehiclesQueryDto, CreateVehicleDto } from './dto/vehicle.dto';
import { isTemperatureCompatible } from './temperature-match';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto): Promise<VehicleDto> {
    const existing = await this.prisma.vehicle.findFirst({
      where: { plateNumber: dto.plateNumber, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException({ code: 'PLATE_EXISTS', message: 'رقم اللوحة مسجّل مسبقاً' });
    }
    const created = await this.prisma.vehicle.create({
      data: {
        plateNumber: dto.plateNumber,
        type: dto.type,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        capacityKg: dto.capacityKg,
        temperatureCapability: dto.temperatureCapability,
      },
    });
    return VehiclesService.toDto(created);
  }

  async findAll(): Promise<VehicleDto[]> {
    const rows = await this.prisma.vehicle.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(VehiclesService.toDto);
  }

  /** المركبات المتاحة للإسناد، مع فلترة توافق التبريد (Q9). */
  async findAvailable(query: AvailableVehiclesQueryDto): Promise<VehicleDto[]> {
    const where: Prisma.VehicleWhereInput = { status: VehicleStatus.AVAILABLE, deletedAt: null };
    if (query.vehicleType) where.type = query.vehicleType;

    const rows = await this.prisma.vehicle.findMany({ where, orderBy: { plateNumber: 'asc' } });
    const filtered = rows.filter((v) =>
      isTemperatureCompatible(
        query.temperatureType ?? null,
        v.temperatureCapability as TemperatureCapability,
      ),
    );
    return filtered.map(VehiclesService.toDto);
  }

  async findOne(id: string): Promise<VehicleDto> {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id, deletedAt: null } });
    if (!vehicle) {
      throw new NotFoundException({ code: 'VEHICLE_NOT_FOUND', message: 'المركبة غير موجودة' });
    }
    return VehiclesService.toDto(vehicle);
  }

  async updateStatus(id: string, status: VehicleStatus): Promise<VehicleDto> {
    await this.findOne(id);
    const updated = await this.prisma.vehicle.update({ where: { id }, data: { status } });
    return VehiclesService.toDto(updated);
  }

  async update(
    id: string,
    data: {
      make?: string;
      model?: string;
      year?: number;
      capacityKg?: number;
      temperatureCapability?: TemperatureCapability;
    },
  ): Promise<VehicleDto> {
    await this.findOne(id);
    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        make: data.make ?? undefined,
        model: data.model ?? undefined,
        year: data.year ?? undefined,
        capacityKg: data.capacityKg ?? undefined,
        temperatureCapability: data.temperatureCapability ?? undefined,
      },
    });
    return VehiclesService.toDto(updated);
  }

  /** تغيير حالة عدة مركبات دفعة واحدة (SPEC §5.1 Bulk Operations). */
  async bulkStatus(ids: string[], status: VehicleStatus): Promise<{ updated: number }> {
    const res = await this.prisma.vehicle.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status },
    });
    return { updated: res.count };
  }

  /** تصدير قائمة المركبات CSV (SPEC §5.1). */
  async exportCsv(): Promise<string> {
    const rows = await this.prisma.vehicle.findMany({
      where: { deletedAt: null },
      orderBy: { plateNumber: 'asc' },
    });
    const headers = [
      'رقم اللوحة',
      'النوع',
      'الصانع',
      'الموديل',
      'السنة',
      'الحمولة (كجم)',
      'قدرة التبريد',
      'الحالة',
    ];
    const data = rows.map((v) => [
      v.plateNumber,
      v.type,
      v.make,
      v.model,
      v.year,
      Number(v.capacityKg),
      v.temperatureCapability,
      v.status,
    ]);
    return toCsv(headers, data);
  }

  static toDto(v: PrismaVehicle): VehicleDto {
    return {
      id: v.id,
      plateNumber: v.plateNumber,
      type: v.type as VehicleType,
      make: v.make,
      model: v.model,
      year: v.year,
      capacityKg: Number(v.capacityKg),
      temperatureCapability: v.temperatureCapability as TemperatureCapability,
      status: v.status as VehicleStatus,
      currentDriverId: v.currentDriverId,
      lastMaintenanceDate: v.lastMaintenanceDate?.toISOString() ?? null,
      nextMaintenanceDate: v.nextMaintenanceDate?.toISOString() ?? null,
      registrationExpiry: v.registrationExpiry?.toISOString() ?? null,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    };
  }
}
