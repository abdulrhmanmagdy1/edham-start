import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LocationPoint as LocationDto, UserRole } from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateLocationsDto } from './dto/location.dto';
import { LocationsService } from './locations.service';

@Controller('locations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  // معدّل أعلى لتحديثات GPS (TECH.md §5.4): 200/دقيقة
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.DRIVER)
  @Throttle({ default: { limit: 200, ttl: 60_000 } })
  ingest(
    @Body() dto: CreateLocationsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ count: number }> {
    return this.locations.ingest(dto, user);
  }

  @Get('trip/:id')
  @Roles(UserRole.SUPERVISOR, UserRole.CUSTOMER)
  findByTrip(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<LocationDto[]> {
    return this.locations.findByTrip(id, user);
  }

  @Get('fleet')
  @Roles(UserRole.SUPERVISOR)
  fleet(): Promise<LocationDto[]> {
    return this.locations.fleet();
  }
}
