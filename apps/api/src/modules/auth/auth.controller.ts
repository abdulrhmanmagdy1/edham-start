import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthTokens, User as UserDto } from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  ResetPasswordDto,
  SendOtpDto,
  SignupCustomerDto,
  VerifyOtpDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // منع SMS flooding (TECH.md §5.4): 5 طلبات/ساعة
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  sendOtp(@Body() dto: SendOtpDto): Promise<{ success: boolean; expiresIn: number }> {
    return this.auth.sendOtp(dto.phone);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthTokens> {
    return this.auth.verifyOtp(dto.phone, dto.otp);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 900_000 } })
  login(@Body() dto: LoginDto): Promise<AuthTokens> {
    return this.auth.login(dto.identifier, dto.password);
  }

  /** تسجيل ذاتي للعميل (شركة B2B) — CUSTOMER حصراً. */
  @Post('signup-customer')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  signupCustomer(
    @Body() dto: SignupCustomerDto,
  ): Promise<{ requiresOtpVerification: true; phone: string; expiresIn: number }> {
    return this.auth.signupCustomer(dto);
  }

  @Post('verify-signup-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  verifySignupOtp(@Body() dto: VerifyOtpDto): Promise<AuthTokens> {
    return this.auth.verifySignupOtp(dto.phone, dto.otp);
  }

  // استعادة كلمة المرور: 3 طلبات / 15 دقيقة
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 900_000 } })
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ success: boolean; channel: 'phone' | 'email' }> {
    return this.auth.forgotPassword(dto.identifier);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ success: boolean }> {
    return this.auth.resetPassword(dto.identifier, dto.otp, dto.newPassword);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto): Promise<{ accessToken: string; refreshToken: string }> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RefreshDto,
  ): Promise<{ success: boolean }> {
    await this.auth.logout(user.sub, dto.refreshToken);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserDto> {
    return this.auth.me(user.sub);
  }

  /**
   * [تجريبي فقط] إظهار رمز OTP الحالي لرقم — مبوّب بـ DEMO_OTP_ENABLED.
   * يُعيد 404 في الإنتاج الحقيقي (الـ flag = false).
   */
  @Get('demo/otp')
  demoOtp(@Query('phone') phone: string): Promise<{ otp: string | null }> {
    if (process.env.DEMO_OTP_ENABLED !== 'true') {
      throw new NotFoundException();
    }
    return this.auth.getDemoOtp(phone);
  }
}
