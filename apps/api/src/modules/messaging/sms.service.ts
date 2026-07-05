import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * إرسال SMS (OTP) عبر Unifonic (SPEC A08).
 * في التطوير بدون مفتاح Unifonic: يُسجَّل الرمز في اللوج فقط ولا يُرسَل فعلياً.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  private get isConfigured(): boolean {
    return Boolean(this.config.get<string>('UNIFONIC_API_KEY'));
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn(`📵 Unifonic غير مُهيّأ — OTP لـ ${phone} = ${code} (وضع تطوير)`);
      return;
    }
    // TODO(Phase 4): تكامل Unifonic REST API الفعلي عبر BullMQ.
    this.logger.log(`📨 إرسال OTP إلى ${phone} عبر Unifonic`);
  }
}
