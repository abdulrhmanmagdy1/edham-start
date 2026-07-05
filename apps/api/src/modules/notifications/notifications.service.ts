import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@edham/shared-types';
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
}
