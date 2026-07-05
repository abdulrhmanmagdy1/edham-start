import { IsEnum, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '@edham/shared-types';

/** المشرف يُدخل السعر يدوياً (PRE-001) — لا حساب تلقائي. */
export class SetPriceDto {
  @IsPositive({ message: 'السعر يجب أن يكون رقماً موجباً' })
  quotedPrice!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  pricingNotes?: string;
}

/** تغيير حالة الطلب يدوياً (المشرف) — يُتحقَّق منه بآلة الحالة. */
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cancellationReason?: string;
}
