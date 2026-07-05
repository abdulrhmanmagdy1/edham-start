import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { User as PrismaUser } from '@prisma/client';
import { AuthTokens, User as UserDto, UserRole } from '@edham/shared-types';
import { SmsService } from '../messaging/sms.service';
import { UsersService } from '../users/users.service';
import { TokenService } from './token.service';

const OTP_TTL_MINUTES = 10; // TECH.md §4.2 (users.otp_expires_at)

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly sms: SmsService,
  ) {}

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

  logout(userId: string, refreshToken: string): void {
    this.tokens.revoke(userId, refreshToken);
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
