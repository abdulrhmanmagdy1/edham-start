import { IsEnum, IsISO8601, IsOptional, IsPositive, IsString, IsUUID, MinLength } from 'class-validator';
import { MaintenanceStatus, MaintenanceType } from '@edham/shared-types';

export class CreateMaintenanceDto {
  @IsUUID()
  vehicleId!: string;

  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @IsString()
  @MinLength(3)
  description!: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}

export class UpdateMaintenanceStatusDto {
  @IsEnum(MaintenanceStatus)
  status!: MaintenanceStatus;

  @IsOptional()
  @IsPositive()
  cost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
