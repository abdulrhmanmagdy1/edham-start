import { Logger } from '@nestjs/common';
import { SmsProvider } from './sms-provider';

interface UnifonicConfig {
  appSid: string;
  senderId: string;
}

/**
 * مزوّد Unifonic (السعودية) — scaffold.
 * ⚠️ يتطلب UNIFONIC_APP_SID صالحاً. لم يُختبَر مع اعتماد حقيقي (deferred — راجع tech-debt.md).
 */
export class UnifonicProvider implements SmsProvider {
  readonly name = 'unifonic';
  private readonly logger = new Logger('UnifonicProvider');
  private static readonly ENDPOINT = 'https://el.cloud.unifonic.com/rest/SMS/messages';

  constructor(private readonly config: UnifonicConfig) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const body = new URLSearchParams({
      AppSid: this.config.appSid,
      SenderID: this.config.senderId,
      Recipient: phone.replace('+', ''),
      Body: `رمز التحقق الخاص بك في إدهام: ${code}`,
    });

    try {
      const res = await fetch(UnifonicProvider.ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) {
        this.logger.error(`فشل إرسال Unifonic (${res.status}) لـ ${phone}`);
        return;
      }
      this.logger.log(`📨 أُرسل OTP عبر Unifonic إلى ${phone}`);
    } catch (error) {
      this.logger.error(`خطأ Unifonic: ${String(error)}`);
    }
  }
}
