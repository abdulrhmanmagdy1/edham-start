import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ClientPricingOverride as PrismaOverride,
  PricingTier as PrismaTier,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateOverrideDto,
  CreatePricingTierDto,
  UpdateOverrideDto,
  UpdatePricingTierDto,
} from './dto/pricing-admin.dto';

const dec = (v: number | undefined): number | undefined => (v === undefined ? undefined : v);

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Pricing Tiers (التعريفة الأساسية) ──

  async listTiers(): Promise<Record<string, unknown>[]> {
    const rows = await this.prisma.pricingTier.findMany({ orderBy: { name: 'asc' } });
    return rows.map(PricingService.tierDto);
  }

  async createTier(dto: CreatePricingTierDto): Promise<Record<string, unknown>> {
    try {
      const tier = await this.prisma.pricingTier.create({
        data: {
          name: dto.name,
          basePricePerKm: dec(dto.basePricePerKm),
          basePricePerKg: dec(dto.basePricePerKg),
          temperatureSurcharge: dec(dto.temperatureSurcharge),
          minCharge: dec(dto.minCharge),
        },
      });
      return PricingService.tierDto(tier);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({ code: 'TIER_EXISTS', message: 'اسم الشريحة مستخدم مسبقاً' });
      }
      throw error;
    }
  }

  async updateTier(id: string, dto: UpdatePricingTierDto): Promise<Record<string, unknown>> {
    await this.ensureTier(id);
    const tier = await this.prisma.pricingTier.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        basePricePerKm: dec(dto.basePricePerKm),
        basePricePerKg: dec(dto.basePricePerKg),
        temperatureSurcharge: dec(dto.temperatureSurcharge),
        minCharge: dec(dto.minCharge),
      },
    });
    return PricingService.tierDto(tier);
  }

  async deleteTier(id: string): Promise<{ success: boolean }> {
    await this.ensureTier(id);
    await this.prisma.clientPricingOverride.updateMany({
      where: { pricingTierId: id },
      data: { pricingTierId: null },
    });
    await this.prisma.pricingTier.delete({ where: { id } });
    return { success: true };
  }

  // ── Client Pricing Overrides (أسعار خاصة لعميل) ──

  async listOverrides(clientId?: string): Promise<Record<string, unknown>[]> {
    const rows = await this.prisma.clientPricingOverride.findMany({
      where: clientId ? { clientId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { companyName: true } },
        pricingTier: { select: { name: true } },
      },
    });
    return rows.map(PricingService.overrideDto);
  }

  async createOverride(dto: CreateOverrideDto): Promise<Record<string, unknown>> {
    const client = await this.prisma.customer.findUnique({ where: { id: dto.clientId }, select: { id: true } });
    if (!client) throw new NotFoundException({ code: 'CUSTOMER_NOT_FOUND', message: 'الشركة غير موجودة' });

    const override = await this.prisma.clientPricingOverride.create({
      data: {
        clientId: dto.clientId,
        pricingTierId: dto.pricingTierId ?? null,
        customPricePerKm: dec(dto.customPricePerKm),
        customPricePerKg: dec(dto.customPricePerKg),
        discountPercentage: dec(dto.discountPercentage),
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
      include: {
        client: { select: { companyName: true } },
        pricingTier: { select: { name: true } },
      },
    });
    return PricingService.overrideDto(override);
  }

  async updateOverride(id: string, dto: UpdateOverrideDto): Promise<Record<string, unknown>> {
    await this.ensureOverride(id);
    const override = await this.prisma.clientPricingOverride.update({
      where: { id },
      data: {
        pricingTierId: dto.pricingTierId ?? undefined,
        customPricePerKm: dec(dto.customPricePerKm),
        customPricePerKg: dec(dto.customPricePerKg),
        discountPercentage: dec(dto.discountPercentage),
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      },
      include: {
        client: { select: { companyName: true } },
        pricingTier: { select: { name: true } },
      },
    });
    return PricingService.overrideDto(override);
  }

  async deleteOverride(id: string): Promise<{ success: boolean }> {
    await this.ensureOverride(id);
    await this.prisma.clientPricingOverride.delete({ where: { id } });
    return { success: true };
  }

  private async ensureTier(id: string): Promise<void> {
    const exists = await this.prisma.pricingTier.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException({ code: 'TIER_NOT_FOUND', message: 'الشريحة غير موجودة' });
  }

  private async ensureOverride(id: string): Promise<void> {
    const exists = await this.prisma.clientPricingOverride.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException({ code: 'OVERRIDE_NOT_FOUND', message: 'التخصيص غير موجود' });
  }

  private static num(v: Prisma.Decimal | null): number | null {
    return v === null ? null : Number(v);
  }

  static tierDto(t: PrismaTier): Record<string, unknown> {
    return {
      id: t.id,
      name: t.name,
      basePricePerKm: PricingService.num(t.basePricePerKm),
      basePricePerKg: PricingService.num(t.basePricePerKg),
      temperatureSurcharge: PricingService.num(t.temperatureSurcharge),
      minCharge: PricingService.num(t.minCharge),
      createdAt: t.createdAt.toISOString(),
    };
  }

  static overrideDto(
    o: PrismaOverride & { client?: { companyName: string }; pricingTier?: { name: string } | null },
  ): Record<string, unknown> {
    return {
      id: o.id,
      clientId: o.clientId,
      companyName: o.client?.companyName ?? null,
      pricingTierId: o.pricingTierId,
      pricingTierName: o.pricingTier?.name ?? null,
      customPricePerKm: PricingService.num(o.customPricePerKm),
      customPricePerKg: PricingService.num(o.customPricePerKg),
      discountPercentage: PricingService.num(o.discountPercentage),
      validFrom: o.validFrom?.toISOString() ?? null,
      validUntil: o.validUntil?.toISOString() ?? null,
      createdAt: o.createdAt.toISOString(),
    };
  }
}
