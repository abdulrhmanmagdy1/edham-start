import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PricingEmailInput {
  to: string;
  orderId: string;
  quotedPrice: number;
  currency: string;
  pricingNotes?: string | null;
}

/**
 * إرسال البريد (SendGrid). أهم استخدام: إرسال السعر للعميل بعد تحديد المشرف (PRE-001).
 * في التطوير بدون مفتاح SendGrid: يُسجَّل في اللوج فقط.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  private get isConfigured(): boolean {
    return Boolean(this.config.get<string>('SENDGRID_API_KEY'));
  }

  async sendPricingEmail(input: PricingEmailInput): Promise<void> {
    const summary = `طلب ${input.orderId}: ${input.quotedPrice} ${input.currency} (قبل الضريبة)`;
    if (!this.isConfigured) {
      this.logger.warn(`📭 SendGrid غير مُهيّأ — بريد التسعير إلى ${input.to} — ${summary} (تطوير)`);
      return;
    }
    // TODO(Phase 4): تكامل SendGrid الفعلي + قالب HTML عربي + أزرار قبول/رفض.
    this.logger.log(`📧 إرسال بريد التسعير إلى ${input.to} — ${summary}`);
  }
}
