import { Logger } from '@nestjs/common';
import { EmailProvider } from './email-provider';

/**
 * مزوّد Brevo — بريد عبر HTTPS API (منفذ 443).
 * السبب: منصّة الاستضافة (Railway) تحجب منافذ SMTP الصادرة (25/465/587)،
 * فأي إرسال SMTP يفشل بـ ENETUNREACH/timeout. Brevo عبر HTTPS يتخطّى ذلك.
 * لا يحتاج دوميناً موثّقاً — يكفي مُرسِل (sender) مؤكَّد في لوحة Brevo.
 */
export class BrevoEmailProvider implements EmailProvider {
  readonly name = 'brevo';
  private readonly logger = new Logger('BrevoEmailProvider');
  private static readonly ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
  private readonly senderName: string;
  private readonly senderEmail: string;

  constructor(
    private readonly apiKey: string,
    from: string,
  ) {
    // يقبل "الاسم <email>" أو "email" فقط
    const match = /^\s*(.*?)\s*<\s*([^>]+)\s*>\s*$/.exec(from);
    if (match) {
      this.senderName = match[1] || 'إدهام للوجستيات';
      this.senderEmail = match[2];
    } else {
      this.senderName = 'إدهام للوجستيات';
      this.senderEmail = from.trim();
    }
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    try {
      const res = await fetch(BrevoEmailProvider.ENDPOINT, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: this.senderName, email: this.senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: body,
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        this.logger.error(`فشل Brevo (${res.status}) إلى ${to}: ${detail.slice(0, 200)}`);
        return;
      }
      this.logger.log(`📧 أُرسل بريد عبر Brevo إلى ${to}`);
    } catch (error) {
      // لا نُفشل العملية الأساسية بسبب فشل البريد
      this.logger.error(`خطأ Brevo: ${String(error)}`);
    }
  }
}
