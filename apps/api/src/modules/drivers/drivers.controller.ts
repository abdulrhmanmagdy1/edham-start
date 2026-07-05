import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { Driver as DriverDto, DriverStatus, UserRole } from '@edham/shared-types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DriversService } from './drivers.service';

class UpdateDriverStatusDto {
  @IsEnum(DriverStatus)
  status!: DriverStatus;
}

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get()
  @Roles(UserRole.SUPERVISOR)
  findAll(): Promise<DriverDto[]> {
    return this.drivers.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPERVISOR)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DriverDto> {
    return this.drivers.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPERVISOR)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDriverStatusDto,
  ): Promise<DriverDto> {
    return this.drivers.updateStatus(id, dto.status);
  }
}
