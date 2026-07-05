import { Injectable, NotFoundException } from '@nestjs/common';
import { Driver as PrismaDriver } from '@prisma/client';
import { Driver as DriverDto, DriverStatus } from '@edham/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<DriverDto[]> {
    const rows = await this.prisma.driver.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(DriversService.toDto);
  }

  async findOne(id: string): Promise<DriverDto> {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) {
      throw new NotFoundException({ code: 'DRIVER_NOT_FOUND', message: 'السائق غير موجود' });
    }
    return DriversService.toDto(driver);
  }

  async updateStatus(id: string, status: DriverStatus): Promise<DriverDto> {
    await this.findOne(id);
    const updated = await this.prisma.driver.update({ where: { id }, data: { status } });
    return DriversService.toDto(updated);
  }

  static toDto(d: PrismaDriver): DriverDto {
    return {
      id: d.id,
      userId: d.userId,
      employeeId: d.employeeId,
      licenseNumber: d.licenseNumber,
      licenseExpiry: d.licenseExpiry.toISOString(),
      assignedVehicleId: d.assignedVehicleId,
      status: d.status as DriverStatus,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }
}
