import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoEmailProvider } from './email/brevo-email.provider';
import { EmailProvider } from './email/email-provider';
import { MockEmailProvider } from './email/mock-email.provider';
import { ResendProvider } from './email/resend-email.provider';
import { SmtpEmailProvider } from './email/smtp-email.provider';

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
 * واجهة إرسال البريد — تختار المزوّد تلقائياً (الأولوية بالترتيب):
 * - EMAIL_PROVIDER=brevo + BREVO_API_KEY  → Brevo عبر HTTPS (منفذ 443، لا يُحجب).
 * - EMAIL_PROVIDER=smtp  + SMTP_USER/PASS → SMTP (محجوب على Railway — للتطوير المحلي فقط).
 * - EMAIL_PROVIDER=resend + RESEND_API_KEY → Resend (يتطلب دوميناً موثّقاً).
 * - غير ذلك (أو dev) → Mock (يطبع في اللوج).
 * أهم استخدام: إرسال السعر للعميل (PRE-001) + رمز الدخول + الفواتير.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: EmailProvider;

  constructor(config: ConfigService) {
    const chosen = config.get<string>('EMAIL_PROVIDER', 'mock');
    const brevoKey = config.get<string>('BREVO_API_KEY');
    const apiKey = config.get<string>('RESEND_API_KEY');
    const smtpUser = config.get<string>('SMTP_USER');
    const smtpPass = config.get<string>('SMTP_PASS');
    const from = config.get<string>('EMAIL_FROM', 'no-reply@edham.sa');

    if (chosen === 'brevo' && brevoKey) {
      this.provider = new BrevoEmailProvider(brevoKey, from);
    } else if (chosen === 'smtp' && smtpUser && smtpPass) {
      this.provider = new SmtpEmailProvider(from, {
        host: config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
        port: Number(config.get<string>('SMTP_PORT', '587')),
        user: smtpUser,
        pass: smtpPass,
      });
    } else if (chosen === 'resend' && apiKey) {
      this.provider = new ResendProvider(apiKey, from);
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

  /** رمز الدخول (OTP) للعميل — بديل الـ SMS. */
  async sendLoginOtpEmail(to: string, code: string): Promise<void> {
    const subject = 'رمز الدخول — إدهام للوجستيات';
    const body = `
      <div dir="rtl" style="font-family:Arial,sans-serif">
        <h2 style="color:#0D0D0D">إدهام للوجستيات</h2>
        <p>رمز الدخول الخاص بك:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#DC2626">${code}</p>
        <p>صالح لمدة 10 دقائق. إذا لم تطلب الدخول، تجاهل هذه الرسالة.</p>
      </div>`;
    await this.provider.send(to, subject, body);
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    const subject = 'رمز استعادة كلمة المرور — إدهام للوجستيات';
    const body = `
      <div dir="rtl">
        <h2>استعادة كلمة المرور</h2>
        <p>رمز التحقق الخاص بك: <strong style="font-size:20px">${code}</strong></p>
        <p>صالح لمدة 10 دقائق. إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>
      </div>`;
    await this.provider.send(to, subject, body);
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
