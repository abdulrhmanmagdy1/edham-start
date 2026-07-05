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
