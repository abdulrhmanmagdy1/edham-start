import { Logger } from '@nestjs/common';
import { SmsProvider } from './sms-provider';

/** مزوّد وهمي للتطوير: يطبع الـ OTP في الـ console بدل الإرسال الفعلي. */
export class MockSmsProvider implements SmsProvider {
  readonly name = 'mock';
  private readonly logger = new Logger('MockSmsProvider');

  async sendOtp(phone: string, code: string): Promise<void> {
    this.logger.warn(`📵 [MOCK SMS] OTP لـ ${phone} = ${code}`);
  }
}
