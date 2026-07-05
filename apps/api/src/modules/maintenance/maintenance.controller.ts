import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateMaintenanceDto, UpdateMaintenanceStatusDto } from './dto/maintenance.dto';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Post()
  @Roles(UserRole.WORKSHOP, UserRole.DRIVER)
  async create(
    @Body() dto: CreateMaintenanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Record<string, unknown>> {
    return MaintenanceService.toDto(await this.maintenance.create(dto, user));
  }

  @Get()
  @Roles(UserRole.SUPERVISOR, UserRole.WORKSHOP)
  async findAll(): Promise<Record<string, unknown>[]> {
    return (await this.maintenance.findAll()).map(MaintenanceService.toDto);
  }

  @Get('vehicle/:id')
  @Roles(UserRole.SUPERVISOR, UserRole.WORKSHOP)
  async findByVehicle(@Param('id', ParseUUIDPipe) id: string): Promise<Record<string, unknown>[]> {
    return (await this.maintenance.findByVehicle(id)).map(MaintenanceService.toDto);
  }

  @Get(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.WORKSHOP)
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Record<string, unknown>> {
    return MaintenanceService.toDto(await this.maintenance.findOne(id));
  }

  @Patch(':id/status')
  @Roles(UserRole.WORKSHOP)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaintenanceStatusDto,
  ): Promise<Record<string, unknown>> {
    return MaintenanceService.toDto(await this.maintenance.updateStatus(id, dto));
  }
}
