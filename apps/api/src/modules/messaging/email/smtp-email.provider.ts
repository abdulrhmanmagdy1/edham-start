import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { EmailProvider } from './email-provider';

/**
 * مزوّد بريد عبر SMTP (Gmail App Password أو أي خادم SMTP).
 * لا يحتاج دوميناً موثّقاً — يرسل لأي عنوان.
 */
export class SmtpEmailProvider implements EmailProvider {
  readonly name = 'smtp';
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly transporter: Transporter;

  constructor(
    private readonly from: string,
    opts: { host: string; port: number; user: string; pass: string },
  ) {
    // family: 4 — إجبار IPv4؛ بيئة Railway بلا IPv6 وإلا نحصل على ENETUNREACH.
    const transportOptions: SMTPTransport.Options & { family?: number } = {
      host: opts.host,
      port: opts.port,
      secure: opts.port === 465, // 465 = SSL، 587 = STARTTLS
      auth: { user: opts.user, pass: opts.pass },
      family: 4,
      // لو SMTP_HOST عنوان IP رقمي (تجاوز DNS/IPv6) نحتاج اسم المضيف لتحقّق شهادة TLS
      tls: /^\d+\.\d+\.\d+\.\d+$/.test(opts.host)
        ? { servername: 'smtp.gmail.com' }
        : undefined,
      // مهلات قصيرة: لا نُعلّق الطلب لو المنفذ محجوب على المضيف
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    };
    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html: body,
      });
      this.logger.log(`✉️ أُرسل بريد إلى ${to}: ${subject}`);
    } catch (err) {
      // لا نُفشل العملية الأساسية بسبب فشل البريد
      this.logger.error(`تعذّر إرسال البريد إلى ${to}: ${String(err)}`);
    }
  }
}
