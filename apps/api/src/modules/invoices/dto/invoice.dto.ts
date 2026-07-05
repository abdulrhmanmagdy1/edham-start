import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** إنشاء فاتورة من طلب مكتمل (SPEC Flow 5). */
export class CreateInvoiceDto {
  @IsUUID()
  orderId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class MarkPaidDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentReference?: string;
}
