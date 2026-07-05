import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockSmsProvider } from './sms/mock-sms.provider';
import { SmsProvider } from './sms/sms-provider';
import { UnifonicProvider } from './sms/unifonic-sms.provider';

/**
 * واجهة إرسال الـ SMS — تختار المزوّد تلقائياً (SPEC A08):
 * - SMS_PROVIDER=unifonic + UNIFONIC_APP_SID مضبوط → Unifonic.
 * - غير ذلك (أو dev) → Mock (يطبع الـ OTP في اللوج).
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: SmsProvider;

  constructor(config: ConfigService) {
    const chosen = config.get<string>('SMS_PROVIDER', 'mock');
    const appSid = config.get<string>('UNIFONIC_APP_SID');

    if (chosen === 'unifonic' && appSid) {
      this.provider = new UnifonicProvider({
        appSid,
        senderId: config.get<string>('UNIFONIC_SENDER_ID', 'Edham'),
      });
    } else {
      this.provider = new MockSmsProvider();
    }
    this.logger.log(`📱 مزوّد SMS: ${this.provider.name}`);
  }

  sendOtp(phone: string, code: string): Promise<void> {
    return this.provider.sendOtp(phone, code);
  }
}
