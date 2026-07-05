import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import {
  TemperatureCapability,
  TemperatureType,
  VehicleStatus,
  VehicleType,
} from '@edham/shared-types';

export class CreateVehicleDto {
  // رقم اللوحة السعودية: 1-3 أحرف عربية + 4 أرقام (TECH.md §4.2)
  @Matches(/^[؀-ۿ]{1,3}\s?\d{4}$/, {
    message: 'رقم اللوحة يجب أن يكون 3 أحرف عربية + 4 أرقام',
  })
  plateNumber!: string;

  @IsEnum(VehicleType)
  type!: VehicleType;

  @IsString()
  make!: string;

  @IsString()
  model!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1990)
  @Max(2100)
  year!: number;

  @IsPositive()
  capacityKg!: number;

  @IsEnum(TemperatureCapability)
  temperatureCapability!: TemperatureCapability;
}

export class UpdateVehicleStatusDto {
  @IsEnum(VehicleStatus)
  status!: VehicleStatus;
}

export class AvailableVehiclesQueryDto {
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsEnum(TemperatureType)
  temperatureType?: TemperatureType;
}
