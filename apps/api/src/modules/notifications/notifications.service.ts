import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@edham/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
}

/**
 * إشعارات داخل النظام (SPEC Feature 5). تُخزَّن في جدول notifications.
 * إرسال FCM/SMS الفعلي يُضاف عبر BullMQ لاحقاً (يحتاج Redis + مفاتيح).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

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
  }
}
