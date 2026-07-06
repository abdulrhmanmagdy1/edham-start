import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Notification as PrismaNotification } from '@prisma/client';
import { Notification as NotificationDto, NotificationType } from '@edham/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DeviceTokenStore } from '../../firebase/device-token.store';
import { FirebaseService } from '../../firebase/firebase.service';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
}

/**
 * إشعارات النظام (SPEC Feature 5): تُخزَّن في جدول notifications،
 * وتُرسَل push عبر FCM لأجهزة المستخدم المسجّلة (إن وُجدت + Firebase مُفعّل).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
    private readonly deviceTokens: DeviceTokenStore,
  ) {}

  async notify(input: CreateNotificationInput): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
      },
    });
    this.logger.log(`🔔 إشعار [${input.type}] → user ${input.userId}: ${input.title}`);

    // إرسال push لأجهزة المستخدم المسجّلة (يُتجاهَل بأمان لو FCM معطّل أو لا أجهزة)
    const tokens = await this.deviceTokens.tokensFor(input.userId);
    if (tokens.length > 0 && this.firebase.enabled) {
      const data: Record<string, string> = { type: input.type };
      if (input.referenceType) data.referenceType = input.referenceType;
      if (input.referenceId) data.referenceId = input.referenceId;
      await Promise.all(
        tokens.map((token) => this.firebase.sendToToken(token, input.title, input.body, data)),
      );
    }
  }

  registerDevice(userId: string, token: string): Promise<void> {
    return this.deviceTokens.register(userId, token);
  }

  /** قائمة إشعارات المستخدم (الأحدث أولاً)، مع خيار غير المقروء فقط. */
  async listForUser(
    userId: string,
    opts: { unreadOnly?: boolean; limit?: number } = {},
  ): Promise<NotificationDto[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId, ...(opts.unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(opts.limit ?? 50, 100),
    });
    return rows.map(NotificationsService.toDto);
  }

  /** عدد الإشعارات غير المقروءة (لعدّاد الجرس). */
  unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  /** تعليم إشعار كمقروء (يتحقق من ملكية المستخدم له). */
  async markRead(userId: string, id: string): Promise<NotificationDto> {
    const existing = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundException({ code: 'NOTIFICATION_NOT_FOUND', message: 'الإشعار غير موجود' });
    }
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return NotificationsService.toDto(updated);
  }

  /** تعليم كل إشعارات المستخدم كمقروءة. */
  async markAllRead(userId: string): Promise<{ updated: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: res.count };
  }

  /** حذف إشعار (يتحقق من ملكية المستخدم له). */
  async remove(userId: string, id: string): Promise<{ success: boolean }> {
    const res = await this.prisma.notification.deleteMany({ where: { id, userId } });
    if (res.count === 0) {
      throw new NotFoundException({ code: 'NOTIFICATION_NOT_FOUND', message: 'الإشعار غير موجود' });
    }
    return { success: true };
  }

  static toDto(n: PrismaNotification): NotificationDto {
    return {
      id: n.id,
      userId: n.userId,
      type: n.type as NotificationType,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      referenceType: n.referenceType,
      referenceId: n.referenceId,
      createdAt: n.createdAt.toISOString(),
    };
  }
}
