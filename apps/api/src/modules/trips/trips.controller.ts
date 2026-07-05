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
import { Trip as TripDto, UserRole } from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { DeliverStopDto, ReportIssueDto } from './dto/trip.dto';
import { TripsService } from './trips.service';

@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  @Get()
  @Roles(UserRole.SUPERVISOR)
  findAll(): Promise<TripDto[]> {
    return this.trips.findAll();
  }

  @Get('my')
  @Roles(UserRole.DRIVER)
  findMy(@CurrentUser() user: AuthenticatedUser): Promise<TripDto[]> {
    return this.trips.findMy(user);
  }

  @Get(':id')
  @Roles(UserRole.SUPERVISOR, UserRole.DRIVER)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TripDto> {
    return this.trips.findOne(id, user);
  }

  @Post(':id/confirm-loading')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DRIVER)
  confirmLoading(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TripDto> {
    return this.trips.confirmLoading(id, user);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DRIVER)
  start(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TripDto> {
    return this.trips.start(id, user);
  }

  @Post(':id/stops/:stopId/deliver')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DRIVER)
  deliverStop(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() dto: DeliverStopDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TripDto> {
    return this.trips.deliverStop(id, stopId, dto, user);
  }

  @Post(':id/report-issue')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DRIVER)
  reportIssue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReportIssueDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean }> {
    return this.trips.reportIssue(id, dto, user);
  }
}
