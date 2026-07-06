import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

const PHONE_REGEX = /^\+9665\d{8}$/;
const PHONE_MSG = 'رقم الجوال يجب أن يكون بصيغة +9665XXXXXXXX';

/** المشرف ينشئ شركة عميلة — الحساب يدخل عبر OTP (بلا كلمة مرور). */
export class CreateCustomerDto {
  @IsString()
  @MinLength(2, { message: 'اسم الشركة مطلوب' })
  companyName!: string;

  @IsString()
  @MinLength(2, { message: 'اسم مسؤول التواصل مطلوب' })
  contactPersonName!: string;

  @Matches(PHONE_REGEX, { message: PHONE_MSG })
  phone!: string;

  @IsOptional()
  @IsEmail({}, { message: 'بريد إلكتروني غير صالح' })
  email?: string;

  @IsOptional()
  @IsString()
  commercialRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsEmail({}, { message: 'بريد الفوترة غير صالح' })
  billingEmail?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  paymentTermsDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  creditLimit?: number;
}

/** تعديل بيانات الشركة (المشرف). */
export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  contactPersonName?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsString()
  billingAddress?: string;

  @IsOptional()
  @IsEmail({}, { message: 'بريد الفوترة غير صالح' })
  billingEmail?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  paymentTermsDays?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  creditLimit?: number;
}
