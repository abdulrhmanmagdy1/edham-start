import { IsEmail, IsISO8601, IsIn, IsString, Matches, MinLength, ValidateIf } from 'class-validator';
import { UserRole } from '@edham/shared-types';

/** أدوار الموظفين التي يستطيع المشرف إنشاؤها (لا CUSTOMER — العميل يسجّل بـ OTP). */
export type EmployeeRole = Exclude<UserRole, UserRole.CUSTOMER>;

const EMPLOYEE_ROLES: EmployeeRole[] = [
  UserRole.DRIVER,
  UserRole.ACCOUNTANT,
  UserRole.WORKSHOP,
  UserRole.SUPERVISOR,
];

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @Matches(/^\+9665\d{8}$/, { message: 'رقم الجوال يجب أن يكون بصيغة +9665XXXXXXXX' })
  phone!: string;

  @IsEmail({}, { message: 'بريد إلكتروني غير صالح' })
  email!: string;

  @IsIn(EMPLOYEE_ROLES, { message: 'دور غير صالح للموظف' })
  role!: EmployeeRole;

  @IsString()
  @MinLength(8, { message: 'كلمة المرور 8 أحرف على الأقل' })
  password!: string;

  // بيانات السائق (إلزامية فقط لو role = DRIVER)
  @ValidateIf((o: CreateUserDto) => o.role === UserRole.DRIVER)
  @IsString()
  employeeId?: string;

  @ValidateIf((o: CreateUserDto) => o.role === UserRole.DRIVER)
  @IsString()
  licenseNumber?: string;

  @ValidateIf((o: CreateUserDto) => o.role === UserRole.DRIVER)
  @IsISO8601()
  licenseExpiry?: string;
}
