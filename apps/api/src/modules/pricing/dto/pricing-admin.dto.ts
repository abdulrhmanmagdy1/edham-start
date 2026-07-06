import { IsInt, IsISO8601, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class CreatePricingTierDto {
  @IsString()
  @MinLength(2, { message: 'اسم الشريحة مطلوب' })
  name!: string;

  @IsOptional()
  @Min(0)
  basePricePerKm?: number;

  @IsOptional()
  @Min(0)
  basePricePerKg?: number;

  @IsOptional()
  @Min(0)
  temperatureSurcharge?: number;

  @IsOptional()
  @Min(0)
  minCharge?: number;
}

export class UpdatePricingTierDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @Min(0)
  basePricePerKm?: number;

  @IsOptional()
  @Min(0)
  basePricePerKg?: number;

  @IsOptional()
  @Min(0)
  temperatureSurcharge?: number;

  @IsOptional()
  @Min(0)
  minCharge?: number;
}

export class CreateOverrideDto {
  @IsUUID('4', { message: 'معرّف الشركة غير صالح' })
  clientId!: string;

  @IsOptional()
  @IsUUID('4')
  pricingTierId?: string;

  @IsOptional()
  @Min(0)
  customPricePerKm?: number;

  @IsOptional()
  @Min(0)
  customPricePerKg?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;
}

export class UpdateOverrideDto {
  @IsOptional()
  @IsUUID('4')
  pricingTierId?: string;

  @IsOptional()
  @Min(0)
  customPricePerKm?: number;

  @IsOptional()
  @Min(0)
  customPricePerKg?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;
}
