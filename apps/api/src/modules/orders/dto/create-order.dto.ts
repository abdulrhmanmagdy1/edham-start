import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { CargoType, TemperatureType, VehicleType } from '@edham/shared-types';

export class PickupDto {
  @IsString()
  @MinLength(3)
  address!: string;

  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;
}

export class OrderStopInputDto {
  @IsNumber()
  @Min(1)
  sequenceNumber!: number;

  @IsString()
  @MinLength(3)
  address!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsISO8601()
  scheduledArrival?: string;
}

export class CreateOrderDto {
  @ValidateNested()
  @Type(() => PickupDto)
  pickup!: PickupDto;

  @IsArray()
  @ArrayMinSize(1, { message: 'يجب إضافة محطة واحدة على الأقل' })
  @ValidateNested({ each: true })
  @Type(() => OrderStopInputDto)
  stops!: OrderStopInputDto[];

  @IsEnum(VehicleType)
  vehicleTypeRequired!: VehicleType;

  @IsEnum(CargoType)
  cargoType!: CargoType;

  @IsPositive()
  cargoWeightKg!: number;

  @IsOptional()
  @IsString()
  cargoDescription?: string;

  @IsBoolean()
  coldChainRequired!: boolean;

  // مطلوب فقط لو coldChainRequired = true (Q9)
  @ValidateIf((o: CreateOrderDto) => o.coldChainRequired)
  @IsEnum(TemperatureType, { message: 'نوع التبريد مطلوب للشحنة المبردة/المجمدة' })
  temperatureType?: TemperatureType;

  @IsISO8601()
  scheduledAt!: string;
}

/** المشرف ينشئ طلباً نيابةً عن شركة (Flow 1B) — نفس بيانات الطلب + معرّف الشركة. */
export class CreateOrderForCustomerDto extends CreateOrderDto {
  @IsUUID('4', { message: 'معرّف الشركة غير صالح' })
  customerId!: string;
}
