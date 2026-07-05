import { Logger } from '@nestjs/common';
import { EmailProvider } from './email-provider';

/**
 * مزوّد Resend — scaffold (يستخدم Resend HTTP API عبر fetch، بلا SDK).
 * ⚠️ يتطلب RESEND_API_KEY صالحاً. deferred — راجع tech-debt.md.
 */
export class ResendProvider implements EmailProvider {
  readonly name = 'resend';
  private readonly logger = new Logger('ResendProvider');
  private static readonly ENDPOINT = 'https://api.resend.com/emails';

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(to: string, subject: string, body: string): Promise<void> {
    try {
      const res = await fetch(ResendProvider.ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: this.from, to, subject, html: body }),
      });
      if (!res.ok) {
        this.logger.error(`فشل Resend (${res.status}) إلى ${to}`);
        return;
      }
      this.logger.log(`📧 أُرسل بريد عبر Resend إلى ${to}`);
    } catch (error) {
      this.logger.error(`خطأ Resend: ${String(error)}`);
    }
  }
}
