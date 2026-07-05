import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { App, cert, getApp, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

/**
 * تهيئة Firebase Admin SDK من ملف service account (FIREBASE_SERVICE_ACCOUNT_PATH).
 * محميّ: لو الملف غير موجود/غير صالح → يُعطَّل الإرسال بأمان (لا يُسقط الخادم).
 */
@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: App | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const path = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
    if (!path) {
      this.logger.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_PATH غير مضبوط — FCM معطّل');
      return;
    }
    try {
      const abs = resolve(process.cwd(), path);
      const serviceAccount = JSON.parse(readFileSync(abs, 'utf8')) as ServiceAccount;
      this.app = getApps().length ? getApp() : initializeApp({ credential: cert(serviceAccount) });
      const projectId = this.config.get<string>('FIREBASE_PROJECT_ID', 'unknown');
      this.logger.log(`✅ Firebase Admin مُهيّأ (${projectId})`);
    } catch (error) {
      this.logger.warn(`⚠️ تعذّرت تهيئة Firebase Admin — FCM معطّل: ${String(error)}`);
      this.app = null;
    }
  }

  get enabled(): boolean {
    return this.app !== null;
  }

  /** إرسال إشعار push لجهاز واحد. يرجّع true لو أُرسل. */
  async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.app) return false;
    try {
      await getMessaging(this.app).send({ token, notification: { title, body }, data });
      return true;
    } catch (error) {
      this.logger.warn(`فشل إرسال FCM: ${String(error)}`);
      return false;
    }
  }
}
