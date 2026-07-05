import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Global()
@Module({
  providers: [SmsService, EmailService],
  exports: [SmsService, EmailService],
})
export class MessagingModule {}
