import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { Prisma, User as PrismaUser } from '@prisma/client';
import { AuthTokens, User as UserDto, UserRole } from '@edham/shared-types';
import { EmailService } from '../messaging/email.service';
import { SmsService } from '../messaging/sms.service';
import { UsersService } from '../users/users.service';
import { SignupCustomerDto } from './dto/auth.dto';
import { TokenService } from './token.service';

const OTP_TTL_MINUTES = 10; // TECH.md §4.2 (users.otp_expires_at)
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly sms: SmsService,
    private readonly email: EmailService,
  ) {}

  private genOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  /**
   * [وضع التجربة فقط] يُرجّع رمز OTP الحالي لرقم — للعروض التجريبية.
   * يُبوَّب في الـ controller بـ DEMO_OTP_ENABLED؛ يجب أن يكون false في الإنتاج الحقيقي.
   */
  async getDemoOtp(phone: string): Promise<{ otp: string | null }> {
    const user = await this.users.findByPhone(phone);
    return { otp: user?.otpCode ?? null };
  }

  /** POST /auth/signup-customer — تسجيل ذاتي للعميل (CUSTOMER فقط). */
  async signupCustomer(
    dto: SignupCustomerDto,
  ): Promise<{ requiresOtpVerification: true; phone: string; expiresIn: number }> {
    const existing = await this.users.findByPhoneOrEmail(dto.phone, dto.email);
    if (existing) {
      throw new ConflictException({
        code: 'ACCOUNT_EXISTS',
        message: 'يوجد حساب بنفس الجوال أو البريد',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    let user: PrismaUser;
    try {
      user = await this.users.createCustomerAccount({
        companyName: dto.companyName,
        commercialRegistrationNumber: dto.commercialRegistrationNumber,
        vatNumber: dto.vatNumber,
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
      });
    } catch (error) {
      // قيد فريد (السجل التجاري / البريد / الجوال مكرّر) → رسالة واضحة بدل 500
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target) ? (error.meta.target as string[]).join(', ') : '';
        const field = target.includes('commercial')
          ? 'رقم السجل التجاري'
          : target.includes('vat')
            ? 'الرقم الضريبي'
            : target.includes('email')
              ? 'البريد الإلكتروني'
              : 'رقم الجوال';
        throw new ConflictException({ code: 'DUPLICATE_FIELD', message: `${field} مسجّل مسبقاً` });
      }
      throw error;
    }

    const code = this.genOtp();
    await this.users.setOtp(user.id, code, new Date(Date.now() + OTP_TTL_MINUTES * 60_000));
    await this.sms.sendOtp(dto.phone, code);

    return { requiresOtpVerification: true, phone: dto.phone, expiresIn: OTP_TTL_MINUTES * 60 };
  }

  /** POST /auth/verify-signup-otp — تأكيد التسجيل + إصدار توكنات (نفس منطق verify-otp). */
  verifySignupOtp(phone: string, otp: string): Promise<AuthTokens> {
    return this.verifyOtp(phone, otp);
  }

  /** POST /auth/forgot-password — يرسل OTP للجوال أو البريد (بلا كشف وجود الحساب). */
  async forgotPassword(identifier: string): Promise<{ success: boolean; channel: 'phone' | 'email' }> {
    const isEmail = identifier.includes('@');
    const user = await this.users.findByPhoneOrEmail(identifier, identifier);
    if (user) {
      const code = this.genOtp();
      await this.users.setOtp(user.id, code, new Date(Date.now() + OTP_TTL_MINUTES * 60_000));
      if (isEmail && user.email) {
        await this.email.sendOtpEmail(user.email, code);
      } else {
        await this.sms.sendOtp(user.phone, code);
      }
    }
    return { success: true, channel: isEmail ? 'email' : 'phone' };
  }

  /** POST /auth/reset-password — يتحقق من OTP ويحدّث كلمة المرور ويُبطل الجلسات. */
  async resetPassword(identifier: string, otp: string, newPassword: string): Promise<{ success: boolean }> {
    const user = await this.users.findByPhoneOrEmail(identifier, identifier);
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new UnauthorizedException({ code: 'OTP_NOT_FOUND', message: 'لم يُطلب رمز تحقق' });
    }
    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({ code: 'OTP_EXPIRED', message: 'انتهت صلاحية رمز التحقق' });
    }
    if (user.otpCode !== otp) {
      throw new UnauthorizedException({ code: 'OTP_INVALID', message: 'رمز التحقق غير صحيح' });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.users.setPasswordAndClearOtp(user.id, passwordHash);
    await this.tokens.revokeAll(user.id);
    return { success: true };
  }

  /** POST /auth/send-otp — عميل (SPEC §2.1). ينشئ حساب shell للرقم الجديد. */
  async sendOtp(phone: string): Promise<{ success: boolean; expiresIn: number }> {
    let user = await this.users.findByPhone(phone);
    user ??= await this.users.createCustomerShell(phone);

    const code = randomInt(100000, 1000000).toString(); // 6 أرقام
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);
    await this.users.setOtp(user.id, code, expiresAt);
    await this.sms.sendOtp(phone, code);

    return { success: true, expiresIn: OTP_TTL_MINUTES * 60 };
  }

  /** POST /auth/verify-otp — تحقق + إصدار توكنات. */
  async verifyOtp(phone: string, otp: string): Promise<AuthTokens> {
    const user = await this.users.findByPhone(phone);
    if (!user || !user.otpCode || !user.otpExpiresAt) {
      throw new UnauthorizedException({ code: 'OTP_NOT_FOUND', message: 'لم يُطلب رمز تحقق' });
    }
    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException({ code: 'OTP_EXPIRED', message: 'انتهت صلاحية رمز التحقق' });
    }
    if (user.otpCode !== otp) {
      throw new UnauthorizedException({ code: 'OTP_INVALID', message: 'رمز التحقق غير صحيح' });
    }

    await this.users.clearOtpAndTouchLogin(user.id);
    return this.buildAuthResponse(user);
  }

  /** POST /auth/login — موظفون (SPEC §2.2-2.5). */
  async login(identifier: string, password: string): Promise<AuthTokens> {
    const user = await this.users.findByIdentifier(identifier);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'بيانات الدخول غير صحيحة' });
    }
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException({ code: 'ACCOUNT_INACTIVE', message: 'الحساب غير مُفعّل' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'بيانات الدخول غير صحيحة' });
    }

    await this.users.touchLogin(user.id);
    return this.buildAuthResponse(user);
  }

  refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return this.tokens.refresh(refreshToken);
  }

  logout(userId: string, refreshToken: string): Promise<void> {
    return this.tokens.revoke(userId, refreshToken);
  }

  async me(userId: string): Promise<UserDto> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException({ code: 'USER_NOT_FOUND', message: 'المستخدم غير موجود' });
    }
    return AuthService.toUserDto(user);
  }

  private async buildAuthResponse(user: PrismaUser): Promise<AuthTokens> {
    const dto = AuthService.toUserDto(user);
    const { accessToken, refreshToken } = await this.tokens.issueTokens({
      id: user.id,
      role: dto.role,
    });
    return { accessToken, refreshToken, user: dto };
  }

  static toUserDto(user: PrismaUser): UserDto {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role as UserRole,
      status: user.status as UserDto['status'],
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
