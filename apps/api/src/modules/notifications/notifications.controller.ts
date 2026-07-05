import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

class RegisterDeviceDto {
  @IsString()
  @MinLength(10)
  token!: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** تسجيل رمز جهاز FCM للمستخدم الحالي (يُستدعى من التطبيق بعد الدخول). */
  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  registerDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceDto,
  ): { success: boolean } {
    this.notifications.registerDevice(user.sub, dto.token);
    return { success: true };
  }
}
