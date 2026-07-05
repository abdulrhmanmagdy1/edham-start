import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DeliverStopDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @IsOptional()
  @IsString()
  podPhotoUrl?: string;

  @IsOptional()
  @IsString()
  podSignatureUrl?: string;
}

export class ReportIssueDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  description!: string;
}
