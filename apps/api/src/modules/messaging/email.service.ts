import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider } from './email/email-provider';
import { MockEmailProvider } from './email/mock-email.provider';
import { ResendProvider } from './email/resend-email.provider';

interface PricingEmailInput {
  to: string;
  orderId: string;
  quotedPrice: number;
  currency: string;
  pricingNotes?: string | null;
}

interface InvoiceEmailInput {
  to: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
}

/**
 * واجهة إرسال البريد — تختار المزوّد تلقائياً:
 * - EMAIL_PROVIDER=resend + RESEND_API_KEY مضبوط → Resend.
 * - غير ذلك (أو dev) → Mock (يطبع في اللوج).
 * أهم استخدام: إرسال السعر للعميل (PRE-001) + الفواتير.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: EmailProvider;

  constructor(config: ConfigService) {
    const chosen = config.get<string>('EMAIL_PROVIDER', 'mock');
    const apiKey = config.get<string>('RESEND_API_KEY');

    if (chosen === 'resend' && apiKey) {
      this.provider = new ResendProvider(apiKey, config.get<string>('EMAIL_FROM', 'no-reply@edham.sa'));
    } else {
      this.provider = new MockEmailProvider();
    }
    this.logger.log(`✉️ مزوّد Email: ${this.provider.name}`);
  }

  async sendPricingEmail(input: PricingEmailInput): Promise<void> {
    const subject = `عرض سعر لطلبك ${input.orderId}`;
    const notes = input.pricingNotes ? `<p>${input.pricingNotes}</p>` : '';
    const body = `
      <div dir="rtl">
        <h2>عرض سعر — إدهام للوجستيات</h2>
        <p>السعر المقترح: <strong>${input.quotedPrice} ${input.currency}</strong> (قبل الضريبة)</p>
        ${notes}
        <p>يمكنك قبول السعر أو رفضه من التطبيق.</p>
      </div>`;
    await this.provider.send(input.to, subject, body);
  }

  async sendInvoiceEmail(input: InvoiceEmailInput): Promise<void> {
    const subject = `فاتورة ${input.invoiceNumber} — إدهام للوجستيات`;
    const body = `
      <div dir="rtl">
        <h2>فاتورة ضريبية</h2>
        <p>رقم الفاتورة: <strong>${input.invoiceNumber}</strong></p>
        <p>الإجمالي (شامل الضريبة): <strong>${input.totalAmount} ${input.currency}</strong></p>
      </div>`;
    await this.provider.send(input.to, subject, body);
  }
}
