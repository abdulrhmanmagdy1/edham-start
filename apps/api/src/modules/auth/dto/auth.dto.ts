import { IsEmail, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

/** كلمة مرور قوية: 8+ أحرف، حرف كبير + صغير + رقم. */
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_MSG = 'كلمة المرور 8 أحرف على الأقل وتحوي حرفاً كبيراً وصغيراً ورقماً';
const PHONE_REGEX = /^\+9665\d{8}$/;
const PHONE_MSG = 'رقم الجوال يجب أن يكون بصيغة +9665XXXXXXXX';

export class SendOtpDto {
  @Matches(/^\+9665\d{8}$/, { message: 'رقم الجوال يجب أن يكون بصيغة +9665XXXXXXXX' })
  phone!: string;
}

export class VerifyOtpDto {
  @Matches(/^\+9665\d{8}$/, { message: 'رقم الجوال يجب أن يكون بصيغة +9665XXXXXXXX' })
  phone!: string;

  @Length(6, 6, { message: 'رمز التحقق 6 أرقام' })
  @Matches(/^\d{6}$/, { message: 'رمز التحقق أرقام فقط' })
  otp!: string;
}

export class LoginDto {
  @IsString()
  @MinLength(3)
  identifier!: string; // email أو employeeId

  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

/** تسجيل ذاتي للعميل (شركة B2B) — الدور CUSTOMER حصراً (لا يوجد حقل role). */
export class SignupCustomerDto {
  @IsString()
  @MinLength(2, { message: 'اسم الشركة مطلوب' })
  companyName!: string;

  @IsOptional()
  @IsString()
  commercialRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsString()
  @MinLength(2, { message: 'الاسم الكامل مطلوب' })
  fullName!: string;

  @Matches(PHONE_REGEX, { message: PHONE_MSG })
  phone!: string;

  @IsEmail({}, { message: 'بريد إلكتروني غير صالح' })
  email!: string;

  @Matches(STRONG_PASSWORD, { message: PASSWORD_MSG })
  password!: string;
}

export class ForgotPasswordDto {
  /** جوال (+9665...) أو بريد إلكتروني. */
  @IsString()
  @MinLength(5)
  identifier!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(5)
  identifier!: string;

  @Length(6, 6, { message: 'رمز التحقق 6 أرقام' })
  @Matches(/^\d{6}$/, { message: 'رمز التحقق أرقام فقط' })
  otp!: string;

  @Matches(STRONG_PASSWORD, { message: PASSWORD_MSG })
  newPassword!: string;
}
