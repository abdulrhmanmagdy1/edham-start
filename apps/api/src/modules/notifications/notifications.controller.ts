import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsBooleanString, IsOptional, IsString, MinLength } from 'class-validator';
import { Notification as NotificationDto } from '@edham/shared-types';
import { AuthenticatedUser } from '../../common/auth/auth.types';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

class RegisterDeviceDto {
  @IsString()
  @MinLength(10)
  token!: string;
}

class ListNotificationsQuery {
  @IsOptional()
  @IsBooleanString()
  unreadOnly?: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** قائمة إشعارات المستخدم الحالي (الأحدث أولاً). */
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQuery,
  ): Promise<NotificationDto[]> {
    return this.notifications.listForUser(user.sub, {
      unreadOnly: query.unreadOnly === 'true',
    });
  }

  /** عدّاد غير المقروء (للجرس). */
  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser): Promise<{ count: number }> {
    return { count: await this.notifications.unreadCount(user.sub) };
  }

  /** تعليم كل الإشعارات كمقروءة. */
  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser): Promise<{ updated: number }> {
    return this.notifications.markAllRead(user.sub);
  }

  /** تعليم إشعار واحد كمقروء. */
  @Patch(':id/read')
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationDto> {
    return this.notifications.markRead(user.sub, id);
  }

  /** حذف إشعار. */
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    return this.notifications.remove(user.sub, id);
  }

  /** تسجيل رمز جهاز FCM للمستخدم الحالي (يُستدعى من التطبيق بعد الدخول). */
  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  async registerDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceDto,
  ): Promise<{ success: boolean }> {
    await this.notifications.registerDevice(user.sub, dto.token);
    return { success: true };
  }
}
