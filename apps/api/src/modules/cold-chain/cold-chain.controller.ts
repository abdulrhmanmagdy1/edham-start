import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { TemperatureLog as TempLogDto, UserRole } from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ColdChainService } from './cold-chain.service';
import { CreateTemperatureLogDto } from './dto/temperature-log.dto';

@Controller('temperature-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ColdChainController {
  constructor(private readonly coldChain: ColdChainService) {}

  @Post()
  @Roles(UserRole.DRIVER)
  create(
    @Body() dto: CreateTemperatureLogDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TempLogDto> {
    return this.coldChain.create(dto, user);
  }

  @Get('trip/:id')
  @Roles(UserRole.SUPERVISOR, UserRole.DRIVER, UserRole.CUSTOMER)
  findByTrip(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TempLogDto[]> {
    return this.coldChain.findByTrip(id, user);
  }
}
