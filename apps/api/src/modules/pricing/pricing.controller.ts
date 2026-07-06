import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@edham/shared-types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateOverrideDto,
  CreatePricingTierDto,
  UpdateOverrideDto,
  UpdatePricingTierDto,
} from './dto/pricing-admin.dto';
import { PricingService } from './pricing.service';

/** إدارة التعريفة المرجعية (المشرف فقط) — SPEC §2.3 Feature 9. التسعير الفعلي يدوي. */
@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERVISOR)
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  // ── Tiers ──
  @Get('tiers')
  listTiers(): Promise<Record<string, unknown>[]> {
    return this.pricing.listTiers();
  }

  @Post('tiers')
  createTier(@Body() dto: CreatePricingTierDto): Promise<Record<string, unknown>> {
    return this.pricing.createTier(dto);
  }

  @Patch('tiers/:id')
  updateTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePricingTierDto,
  ): Promise<Record<string, unknown>> {
    return this.pricing.updateTier(id, dto);
  }

  @Delete('tiers/:id')
  deleteTier(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    return this.pricing.deleteTier(id);
  }

  // ── Overrides ──
  @Get('overrides')
  listOverrides(@Query('clientId') clientId?: string): Promise<Record<string, unknown>[]> {
    return this.pricing.listOverrides(clientId);
  }

  @Post('overrides')
  createOverride(@Body() dto: CreateOverrideDto): Promise<Record<string, unknown>> {
    return this.pricing.createOverride(dto);
  }

  @Patch('overrides/:id')
  updateOverride(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOverrideDto,
  ): Promise<Record<string, unknown>> {
    return this.pricing.updateOverride(id, dto);
  }

  @Delete('overrides/:id')
  deleteOverride(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    return this.pricing.deleteOverride(id);
  }
}
