import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Vehicle as VehicleDto, UserRole } from '@edham/shared-types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AvailableVehiclesQueryDto,
  CreateVehicleDto,
  UpdateVehicleStatusDto,
} from './dto/vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Post()
  @Roles(UserRole.SUPERVISOR)
  create(@Body() dto: CreateVehicleDto): Promise<VehicleDto> {
    return this.vehicles.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPERVISOR, UserRole.WORKSHOP)
  findAll(): Promise<VehicleDto[]> {
    return this.vehicles.findAll();
  }

  @Get('available')
  @Roles(UserRole.SUPERVISOR)
  findAvailable(@Query() query: AvailableVehiclesQueryDto): Promise<VehicleDto[]> {
    return this.vehicles.findAvailable(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.WORKSHOP)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<VehicleDto> {
    return this.vehicles.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPERVISOR, UserRole.WORKSHOP)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleStatusDto,
  ): Promise<VehicleDto> {
    return this.vehicles.updateStatus(id, dto.status);
  }
}
