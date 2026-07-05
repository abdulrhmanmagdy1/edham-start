import { Logger } from '@nestjs/common';
import { EmailProvider } from './email-provider';

/** مزوّد وهمي للتطوير: يطبع البريد في الـ console بدل الإرسال. */
export class MockEmailProvider implements EmailProvider {
  readonly name = 'mock';
  private readonly logger = new Logger('MockEmailProvider');

  async send(to: string, subject: string, body: string): Promise<void> {
    this.logger.warn(`📭 [MOCK EMAIL] إلى ${to} | ${subject}\n${body}`);
  }
}
