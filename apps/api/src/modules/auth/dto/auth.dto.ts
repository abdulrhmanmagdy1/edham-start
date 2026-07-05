import { IsString, Length, Matches, MinLength } from 'class-validator';

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
