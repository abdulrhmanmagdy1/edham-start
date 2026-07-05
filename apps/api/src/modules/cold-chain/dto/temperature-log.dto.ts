import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateTemperatureLogDto {
  @IsUUID()
  tripId!: string;

  @IsNumber()
  @Min(-50)
  @Max(60)
  temperatureCelsius!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
